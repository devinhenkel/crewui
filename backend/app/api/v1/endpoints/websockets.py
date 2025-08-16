from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import Dict, Set
import asyncio
import json

from app.core.database import get_db
from app.models.execution import Execution
from app.models.process import Process
from app.core.crewai_service import crewai_service

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Map execution_id -> set of websocket connections
        self.execution_connections: Dict[int, Set[WebSocket]] = {}
        # Map websocket -> execution_id for cleanup
        self.websocket_executions: Dict[WebSocket, int] = {}

    async def connect(self, websocket: WebSocket, execution_id: int):
        await websocket.accept()
        
        if execution_id not in self.execution_connections:
            self.execution_connections[execution_id] = set()
        
        self.execution_connections[execution_id].add(websocket)
        self.websocket_executions[websocket] = execution_id
        
        print(f"🔌 WebSocket connected for execution {execution_id}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.websocket_executions:
            execution_id = self.websocket_executions[websocket]
            
            # Remove from execution connections
            if execution_id in self.execution_connections:
                self.execution_connections[execution_id].discard(websocket)
                if not self.execution_connections[execution_id]:
                    del self.execution_connections[execution_id]
            
            # Remove from websocket tracking
            del self.websocket_executions[websocket]
            
            print(f"🔌 WebSocket disconnected for execution {execution_id}")

    async def send_to_execution(self, execution_id: int, message: dict):
        if execution_id in self.execution_connections:
            connections_to_remove = set()
            
            for websocket in self.execution_connections[execution_id]:
                try:
                    await websocket.send_text(json.dumps(message))
                except:
                    connections_to_remove.add(websocket)
            
            # Clean up broken connections
            for websocket in connections_to_remove:
                self.disconnect(websocket)

    def get_execution_connection_count(self, execution_id: int) -> int:
        return len(self.execution_connections.get(execution_id, set()))

# Global connection manager
manager = ConnectionManager()

@router.websocket("/ws/execution/{execution_id}")
async def websocket_execution_endpoint(websocket: WebSocket, execution_id: int):
    """WebSocket endpoint for streaming execution output"""
    await manager.connect(websocket, execution_id)
    
    try:
        # Send initial connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "execution_id": execution_id,
            "timestamp": asyncio.get_event_loop().time()
        }))
        
        # Keep connection alive and listen for client messages
        while True:
            try:
                # Wait for client messages (like stop commands)
                data = await asyncio.wait_for(websocket.receive_text(), timeout=1.0)
                message = json.loads(data)
                
                if message.get("type") == "stop_execution":
                    print(f"🛑 Received stop command for execution {execution_id}")
                    # Handle stop execution logic here
                    await manager.send_to_execution(execution_id, {
                        "type": "execution_stopped",
                        "execution_id": execution_id,
                        "message": "Execution stop requested"
                    })
                    
            except asyncio.TimeoutError:
                # No message received, continue listening
                continue
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON message"
                }))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.post("/{process_id}/execute/stream")
async def execute_process_with_websocket(
    process_id: int,
    execution_request: dict,
    db: Session = Depends(get_db)
):
    """Start process execution and return execution_id for WebSocket connection"""
    from datetime import datetime
    
    # Create a simple schema for validation
    class ExecutionRequest:
        def __init__(self, variables: dict = None):
            self.variables = variables or {}
    
    # Validate the request
    try:
        validated_request = ExecutionRequest(**execution_request)
    except Exception as e:
        return {"error": f"Invalid request: {str(e)}"}, 400
    
    # Get the process
    process = db.query(Process).filter(Process.id == process_id).first()
    if process is None:
        return {"error": "Process not found"}, 404
    
    # Create execution record
    execution = Execution(
        process_id=process_id,
        status="running",
        started_at=datetime.utcnow(),
        console_log="🚀 Starting process execution...\n"
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)
    
    # Start the execution in background
    asyncio.create_task(
        execute_with_websocket_streaming(
            execution.id, 
            process, 
            validated_request.variables, 
            db
        )
    )
    
    return {
        "execution_id": execution.id,
        "message": "Execution started",
        "websocket_url": f"/api/v1/ws/execution/{execution.id}"
    }

async def execute_with_websocket_streaming(
    execution_id: int, 
    process: Process, 
    variables: Dict[str, str], 
    db: Session
):
    """Execute process and stream output via WebSocket"""
    from datetime import datetime
    
    # Initialize accumulated console log with existing content
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    accumulated_log = execution.console_log if execution and execution.console_log else "🚀 Starting process execution...\n"
    
    try:
        print(f"🚀 Starting WebSocket streaming execution {execution_id}")
        
        # Send initial status
        await manager.send_to_execution(execution_id, {
            "type": "execution_started",
            "execution_id": execution_id,
            "process_name": process.name,
            "variables": variables
        })
        
        # Execute the process and stream output
        async for output_chunk in crewai_service.execute_process(
            process=process,
            execution_id=execution_id,
            variables=variables,
            db=db
        ):
            # Accumulate the output for database storage
            accumulated_log += output_chunk
            
            # Send each chunk via WebSocket
            await manager.send_to_execution(execution_id, {
                "type": "output",
                "execution_id": execution_id,
                "content": output_chunk,
                "timestamp": asyncio.get_event_loop().time()
            })
            
            # Periodically save to database (every 50 chunks or so to avoid too many DB calls)
            if len(accumulated_log) % 2000 == 0:  # Every ~2KB of output
                execution = db.query(Execution).filter(Execution.id == execution_id).first()
                if execution:
                    execution.console_log = accumulated_log
                    db.commit()
        
        # Send completion status
        await manager.send_to_execution(execution_id, {
            "type": "execution_completed",
            "execution_id": execution_id,
            "message": "Process execution completed successfully"
        })
        
        # Final update to execution status and save all accumulated logs
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if execution:
            execution.status = "completed"
            execution.completed_at = datetime.utcnow()
            execution.console_log = accumulated_log  # Save all accumulated output
            db.commit()
            
        print(f"✅ Completed execution {execution_id} with {len(accumulated_log)} characters of log data")
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        
        print(f"❌ Error in WebSocket execution {execution_id}: {str(e)}")
        print(f"❌ Traceback: {error_details}")
        
        # Add error to accumulated log
        accumulated_log += f"\n❌ Error: {str(e)}\n{error_details}"
        
        # Send error via WebSocket
        await manager.send_to_execution(execution_id, {
            "type": "execution_error",
            "execution_id": execution_id,
            "error": str(e),
            "traceback": error_details
        })
        
        # Update execution status in database with all accumulated output
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if execution:
            execution.status = "failed"
            execution.completed_at = datetime.utcnow()
            execution.console_log = accumulated_log  # Save all accumulated output including error
            db.commit()
            
        print(f"❌ Failed execution {execution_id} with {len(accumulated_log)} characters of log data")

# Export the connection manager for use in other modules
__all__ = ["router", "manager"]
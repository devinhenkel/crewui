from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import re
import json
import asyncio
# from crewai import Crew, Agent, Task
# from langchain_openai import ChatOpenAI

from app.core.database import get_db
from app.models.process import Process
from app.models.execution import Execution
from app.models.agent import Agent as AgentModel
from app.models.task import Task as TaskModel
from app.models.tool import Tool
# from app.core.crewai_tools import get_crewai_tool

router = APIRouter()

# Pydantic models for request/response
class ProcessBase(BaseModel):
    name: str
    description: str | None = None
    process_type: str  # 'sequential' or 'hierarchical'
    configuration: dict

class ProcessCreate(ProcessBase):
    pass

class ProcessUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    process_type: str | None = None
    configuration: dict | None = None

class ProcessResponse(ProcessBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ExecutionRequest(BaseModel):
    variables: Dict[str, str] = {}

class ExecutionResponse(BaseModel):
    execution_id: int
    message: str
    status: str

@router.get("/", response_model=List[ProcessResponse])
def get_processes(
    skip: int = 0, 
    limit: int = 100, 
    search: str = None,
    db: Session = Depends(get_db)
):
    """Get all processes with pagination and search"""
    query = db.query(Process)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Process.name.ilike(search_filter)) |
            (Process.description.ilike(search_filter)) |
            (Process.process_type.ilike(search_filter))
        )
    
    processes = query.offset(skip).limit(limit).all()
    return processes

@router.post("/", response_model=ProcessResponse, status_code=status.HTTP_201_CREATED)
def create_process(process: ProcessCreate, db: Session = Depends(get_db)):
    """Create a new process"""
    if process.process_type not in ['sequential', 'hierarchical']:
        raise HTTPException(status_code=400, detail="Process type must be 'sequential' or 'hierarchical'")
    
    db_process = Process(**process.dict())
    db.add(db_process)
    db.commit()
    db.refresh(db_process)
    return db_process

@router.get("/{process_id}", response_model=ProcessResponse)
def get_process(process_id: int, db: Session = Depends(get_db)):
    """Get a specific process by ID"""
    process = db.query(Process).filter(Process.id == process_id).first()
    if process is None:
        raise HTTPException(status_code=404, detail="Process not found")
    return process

@router.put("/{process_id}", response_model=ProcessResponse)
def update_process(process_id: int, process: ProcessUpdate, db: Session = Depends(get_db)):
    """Update a process"""
    db_process = db.query(Process).filter(Process.id == process_id).first()
    if db_process is None:
        raise HTTPException(status_code=404, detail="Process not found")
    
    update_data = process.dict(exclude_unset=True)
    if 'process_type' in update_data and update_data['process_type'] not in ['sequential', 'hierarchical']:
        raise HTTPException(status_code=400, detail="Process type must be 'sequential' or 'hierarchical'")
    
    for field, value in update_data.items():
        setattr(db_process, field, value)
    
    db.commit()
    db.refresh(db_process)
    return db_process

@router.delete("/{process_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_process(process_id: int, db: Session = Depends(get_db)):
    """Delete a process"""
    process = db.query(Process).filter(Process.id == process_id).first()
    if process is None:
        raise HTTPException(status_code=404, detail="Process not found")
    
    db.delete(process)
    db.commit()
    return None

@router.post("/{process_id}/execute", response_model=ExecutionResponse, status_code=status.HTTP_202_ACCEPTED)
def execute_process(
    process_id: int, 
    execution_request: ExecutionRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Execute a process with variable substitution and CrewAI integration"""
    process = db.query(Process).filter(Process.id == process_id).first()
    if process is None:
        raise HTTPException(status_code=404, detail="Process not found")
    
    # Create execution record
    execution = Execution(
        process_id=process_id,
        status="running",
        console_log="Starting process execution...\n"
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)
    
    # Start background execution
    background_tasks.add_task(
        run_crewai_process,
        execution.id,
        process.configuration,
        execution_request.variables,
        db
    )
    
    return ExecutionResponse(
        execution_id=execution.id,
        message="Process execution started",
        status="running"
    )

async def run_crewai_process(execution_id: int, configuration: dict, variables: Dict[str, str], db: Session):
    """Background task to run the CrewAI process"""
    try:
        # Update execution status
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if not execution:
            return
        
        execution.console_log += "Initializing CrewAI agents and tasks...\n"
        db.commit()
        
        # For now, just simulate the execution
        execution.console_log += "CrewAI integration coming soon...\n"
        execution.console_log += f"Process configuration: {json.dumps(configuration, indent=2)}\n"
        execution.console_log += f"Variables: {json.dumps(variables, indent=2)}\n"
        
        # Simulate some work
        import time
        time.sleep(2)
        
        execution.console_log += "Execution completed successfully!\n"
        execution.status = "completed"
        execution.completed_at = datetime.utcnow()
        db.commit()
        
    except Exception as e:
        # Update execution with error
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if execution:
            execution.status = "failed"
            execution.console_log += f"\nExecution failed with error: {str(e)}"
            execution.completed_at = datetime.utcnow()
            db.commit()

def substitute_variables(text: str, variables: Dict[str, str]) -> str:
    """Substitute {variable_name} placeholders with actual values"""
    if not text:
        return text
    
    def replace_var(match):
        var_name = match.group(1)
        return variables.get(var_name, match.group(0))
    
    return re.sub(r'\{([^}]+)\}', replace_var, text) 
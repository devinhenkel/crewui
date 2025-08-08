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

from fastapi.responses import StreamingResponse
from app.core.crewai_service import crewai_service

@router.post("/{process_id}/execute", response_model=ExecutionResponse, status_code=status.HTTP_202_ACCEPTED)
async def execute_process(
    process_id: int, 
    execution_request: ExecutionRequest,
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
        started_at=datetime.utcnow()
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)

    # Start streaming response
    return StreamingResponse(
        crewai_service.execute_process(
            process=process,
            execution_id=execution.id,
            variables=execution_request.variables
        ),
        media_type="text/event-stream"
    )
    
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
    """Background task to run the CrewAI process with variable substitution"""
    try:
        # Update execution status
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if not execution:
            return
        
        execution.console_log += "Initializing CrewAI agents and tasks...\n"
        execution.console_log += f"Variables to substitute: {json.dumps(variables, indent=2)}\n"
        db.commit()
        
        # Get process steps
        steps = configuration.get('steps', configuration.get('tasks', []))
        
        # Process each step and apply variable substitution
        processed_agents = []
        processed_tasks = []
        
        for step in steps:
            execution.console_log += f"Processing step {step.get('id', 'unknown')}...\n"
            
            # Get agent and apply variable substitution
            agent = db.query(AgentModel).filter(AgentModel.id == step.get('agent_id')).first()
            if agent:
                # Load actual tool details for agent tools
                agent_tool_details = []
                if agent.tools:
                    tools = db.query(Tool).filter(Tool.id.in_(agent.tools)).all()
                    agent_tool_details = [
                        {
                            'id': tool.id,
                            'name': tool.name,
                            'description': tool.description,
                            'tool_type': tool.tool_type,
                            'category': tool.category,
                            'langchain_tool_name': tool.langchain_tool_name,
                            'crewai_tool_name': tool.crewai_tool_name,
                            'python_code': tool.python_code
                        }
                        for tool in tools
                    ]
                
                # Create a copy of agent with substituted variables and tool details
                substituted_agent = {
                    'id': agent.id,
                    'name': agent.name,
                    'role': substitute_variables(agent.role, variables),
                    'goal': substitute_variables(agent.goal, variables),
                    'backstory': substitute_variables(agent.backstory, variables),
                    'tools': agent_tool_details,
                    'llm_config': agent.llm_config
                }
                processed_agents.append(substituted_agent)
                execution.console_log += f"  Agent '{agent.name}' processed with variable substitutions and {len(agent_tool_details)} tools\n"
            
            # Get task and apply variable substitution
            task = db.query(TaskModel).filter(TaskModel.id == step.get('task_id')).first()
            if task:
                # Get tools assigned to this step from process configuration
                step_tools = step.get('tools', [])
                
                # Load actual tool details for the step tools
                step_tool_details = []
                if step_tools:
                    tools = db.query(Tool).filter(Tool.id.in_(step_tools)).all()
                    step_tool_details = [
                        {
                            'id': tool.id,
                            'name': tool.name,
                            'description': tool.description,
                            'tool_type': tool.tool_type,
                            'category': tool.category,
                            'langchain_tool_name': tool.langchain_tool_name,
                            'crewai_tool_name': tool.crewai_tool_name,
                            'python_code': tool.python_code
                        }
                        for tool in tools
                    ]
                
                # Merge step tools with task tools (step tools take precedence)
                merged_tools = step_tool_details + (task.tools or [])
                
                # Create a copy of task with substituted variables and merged tools
                substituted_task = {
                    'id': task.id,
                    'name': task.name,
                    'description': substitute_variables(task.description, variables),
                    'expected_output': substitute_variables(task.expected_output, variables),
                    'tools': merged_tools,
                    'context': task.context
                }
                processed_tasks.append(substituted_task)
                execution.console_log += f"  Task '{task.name}' processed with variable substitutions and {len(step_tool_details)} step tools\n"
        
        # Log the processed configuration
        execution.console_log += "\nProcessed configuration with variable substitutions:\n"
        execution.console_log += f"Agents: {json.dumps(processed_agents, indent=2)}\n"
        execution.console_log += f"Tasks: {json.dumps(processed_tasks, indent=2)}\n"
        
        # TODO: Here you would actually create and run the CrewAI crew
        # For now, simulate the execution
        execution.console_log += "\nCrewAI execution simulation (integration coming soon)...\n"
        
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
    """Substitute {{variable_name}} placeholders with actual values"""
    if not text:
        return text
    
    def replace_var(match):
        var_name = match.group(1).strip()
        return variables.get(var_name, match.group(0))
    
    return re.sub(r'\{\{([^}]+)\}\}', replace_var, text) 
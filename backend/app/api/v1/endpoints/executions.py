from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models.execution import Execution
from app.models.process import Process
from app.models.agent import Agent as AgentModel
from app.models.task import Task as TaskModel
from app.models.tool import Tool as ToolModel

router = APIRouter()

# Pydantic models for request/response
class ExecutionBase(BaseModel):
    process_id: int
    status: str
    output_path: str | None = None
    console_log: str | None = None

class ExecutionCreate(ExecutionBase):
    pass

class ExecutionUpdate(BaseModel):
    status: str | None = None
    output_path: str | None = None
    console_log: str | None = None
    completed_at: datetime | None = None

class ExecutionResponse(ExecutionBase):
    id: int
    started_at: datetime
    completed_at: datetime | None = None
    
    class Config:
        from_attributes = True

class ExecutionWithProcess(ExecutionResponse):
    process: dict

@router.get("/", response_model=List[ExecutionWithProcess])
def get_executions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all executions with pagination and process details"""
    executions = db.query(Execution).order_by(Execution.started_at.desc()).offset(skip).limit(limit).all()
    
    # Add process details to each execution
    result = []
    for execution in executions:
        # Get process details
        process = db.query(Process).filter(Process.id == execution.process_id).first()
        process_data = {
            "id": process.id,
            "name": process.name,
            "description": process.description,
            "process_type": process.process_type,
            "configuration": process.configuration,
        } if process else {}
        
        result.append({
            **execution.__dict__,
            "process": process_data
        })
    
    return result

@router.get("/{execution_id}", response_model=ExecutionWithProcess)
def get_execution(execution_id: int, db: Session = Depends(get_db)):
    """Get a specific execution by ID with process details"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if execution is None:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    # Get process details
    process = db.query(Process).filter(Process.id == execution.process_id).first()
    process_data = {
        "id": process.id,
        "name": process.name,
        "description": process.description,
        "process_type": process.process_type,
        "configuration": process.configuration,
    } if process else {}
    
    return {
        **execution.__dict__,
        "process": process_data
    }

@router.get("/{execution_id}/resolved")
def get_execution_resolved(execution_id: int, db: Session = Depends(get_db)):
    """Get an execution with resolved process configuration, agents, tasks, and tools.

    This is useful for clients that need to construct a Crew from the stored process configuration.
    """
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if execution is None:
        raise HTTPException(status_code=404, detail="Execution not found")

    process = db.query(Process).filter(Process.id == execution.process_id).first()
    if process is None:
        raise HTTPException(status_code=404, detail="Process not found")

    configuration = process.configuration or {}
    steps = configuration.get("steps", configuration.get("tasks", [])) or []

    # Collect referenced IDs
    agent_ids = sorted({step.get("agent_id") for step in steps if step.get("agent_id") is not None})
    task_ids = sorted({step.get("task_id") for step in steps if step.get("task_id") is not None})

    step_tool_ids = []
    for step in steps:
        tools = step.get("tools") or []
        if isinstance(tools, list):
            step_tool_ids.extend([tool_id for tool_id in tools if isinstance(tool_id, int)])

    # Load entities
    agents = db.query(AgentModel).filter(AgentModel.id.in_(agent_ids)).all() if agent_ids else []
    tasks = db.query(TaskModel).filter(TaskModel.id.in_(task_ids)).all() if task_ids else []

    # Collect tool ids referenced by tasks (if task.tools contains ids)
    task_tool_ids = []
    for task in tasks:
        if isinstance(task.tools, list):
            task_tool_ids.extend([tool_id for tool_id in task.tools if isinstance(tool_id, int)])

    tool_ids = sorted({*step_tool_ids, *task_tool_ids})
    tools = db.query(ToolModel).filter(ToolModel.id.in_(tool_ids)).all() if tool_ids else []

    # Serialize entities minimally
    def serialize_agent(a: AgentModel) -> dict:
        return {
            "id": a.id,
            "name": a.name,
            "role": a.role,
            "goal": a.goal,
            "backstory": a.backstory,
            "tools": a.tools,
            "llm_config": a.llm_config,
            "additional_params": a.additional_params,
        }

    def serialize_task(t: TaskModel) -> dict:
        return {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "expected_output": t.expected_output,
            "tools": t.tools,
            "context": t.context,
            "additional_params": t.additional_params,
        }

    def serialize_tool(t: ToolModel) -> dict:
        return {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "tool_type": t.tool_type,
            "category": t.category,
            "langchain_tool_name": t.langchain_tool_name,
            "crewai_tool_name": t.crewai_tool_name,
            "python_code": t.python_code,
        }

    resolved = {
        "process": {
            "id": process.id,
            "name": process.name,
            "description": process.description,
            "process_type": process.process_type,
            "configuration": configuration,
        },
        "execution": {
            "id": execution.id,
            "status": execution.status,
            "console_log": execution.console_log,
            "started_at": execution.started_at,
            "completed_at": execution.completed_at,
        },
        "steps": steps,
        "agents": [serialize_agent(a) for a in agents],
        "tasks": [serialize_task(t) for t in tasks],
        "tools": [serialize_tool(t) for t in tools],
    }

    return resolved

@router.put("/{execution_id}", response_model=ExecutionResponse)
def update_execution(execution_id: int, execution: ExecutionUpdate, db: Session = Depends(get_db)):
    """Update an execution"""
    db_execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if db_execution is None:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    update_data = execution.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_execution, field, value)
    
    db.commit()
    db.refresh(db_execution)
    return db_execution

@router.delete("/{execution_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_execution(execution_id: int, db: Session = Depends(get_db)):
    """Delete an execution"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if execution is None:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    db.delete(execution)
    db.commit()
    return None

@router.post("/{execution_id}/stop", response_model=ExecutionResponse)
def stop_execution(execution_id: int, db: Session = Depends(get_db)):
    """Stop a running execution"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if execution is None:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    if execution.status not in ["running", "pending"]:
        raise HTTPException(status_code=400, detail="Execution is not running")
    
    execution.status = "stopped"
    execution.completed_at = datetime.utcnow()
    if execution.console_log is None:
        execution.console_log = "Execution stopped by user.\n"
    else:
        execution.console_log += "\nExecution stopped by user.\n"
    db.commit()
    db.refresh(execution)
    
    return execution

@router.get("/process/{process_id}", response_model=List[ExecutionWithProcess])
def get_process_executions(process_id: int, db: Session = Depends(get_db)):
    """Get all executions for a specific process with process details"""
    executions = db.query(Execution).filter(Execution.process_id == process_id).order_by(Execution.started_at.desc()).all()
    
    # Add process details to each execution
    result = []
    for execution in executions:
        # Get process details
        process = db.query(Process).filter(Process.id == execution.process_id).first()
        process_data = {
            "id": process.id,
            "name": process.name,
            "description": process.description,
            "process_type": process.process_type,
            "configuration": process.configuration,
        } if process else {}
        
        result.append({
            **execution.__dict__,
            "process": process_data
        })
    
    return result 
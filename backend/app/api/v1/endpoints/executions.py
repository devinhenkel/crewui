from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models.execution import Execution
from app.models.process import Process

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

@router.get("/", response_model=List[ExecutionResponse])
def get_executions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all executions with pagination"""
    executions = db.query(Execution).order_by(Execution.started_at.desc()).offset(skip).limit(limit).all()
    return executions

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
        "process_type": process.process_type
    } if process else {}
    
    return {
        **execution.__dict__,
        "process": process_data
    }

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
    execution.console_log += "\nExecution stopped by user.\n"
    db.commit()
    db.refresh(execution)
    
    return execution

@router.get("/process/{process_id}", response_model=List[ExecutionResponse])
def get_process_executions(process_id: int, db: Session = Depends(get_db)):
    """Get all executions for a specific process"""
    executions = db.query(Execution).filter(Execution.process_id == process_id).order_by(Execution.started_at.desc()).all()
    return executions 
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models.process import Process

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

@router.get("/", response_model=List[ProcessResponse])
def get_processes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all processes with pagination"""
    processes = db.query(Process).offset(skip).limit(limit).all()
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

@router.post("/{process_id}/execute", status_code=status.HTTP_202_ACCEPTED)
def execute_process(process_id: int, db: Session = Depends(get_db)):
    """Execute a process"""
    process = db.query(Process).filter(Process.id == process_id).first()
    if process is None:
        raise HTTPException(status_code=404, detail="Process not found")
    
    # TODO: Implement process execution logic with Celery
    # This would create an Execution record and trigger the Celery task
    
    return {"message": "Process execution started", "process_id": process_id} 
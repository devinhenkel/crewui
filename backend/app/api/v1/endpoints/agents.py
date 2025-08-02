from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models.agent import Agent

router = APIRouter()

# Pydantic models for request/response
class AgentBase(BaseModel):
    name: str
    role: str
    goal: str
    backstory: str
    tools: list = []
    llm_config: dict = {}
    additional_params: dict = {}

class AgentCreate(AgentBase):
    pass

class AgentUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    goal: str | None = None
    backstory: str | None = None
    tools: list | None = None
    llm_config: dict | None = None
    additional_params: dict | None = None

class AgentResponse(AgentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[AgentResponse])
def get_agents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all agents with pagination"""
    agents = db.query(Agent).offset(skip).limit(limit).all()
    return agents

@router.post("/", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
def create_agent(agent: AgentCreate, db: Session = Depends(get_db)):
    """Create a new agent"""
    db_agent = Agent(**agent.dict())
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: int, db: Session = Depends(get_db)):
    """Get a specific agent by ID"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.put("/{agent_id}", response_model=AgentResponse)
def update_agent(agent_id: int, agent: AgentUpdate, db: Session = Depends(get_db)):
    """Update an agent"""
    db_agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    update_data = agent.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_agent, field, value)
    
    db.commit()
    db.refresh(db_agent)
    return db_agent

@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    """Delete an agent"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    db.delete(agent)
    db.commit()
    return None 
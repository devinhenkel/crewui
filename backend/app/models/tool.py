from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from app.core.database import Base

class Tool(Base):
    __tablename__ = "tools"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=False)
    tool_type = Column(String(50), nullable=False)  # 'langchain', 'custom', 'builtin', 'crewai'
    category = Column(String(100), nullable=False)  # 'web_search', 'file_operations', 'data_analysis', etc.
    
    # For LangChain tools
    langchain_tool_name = Column(String(255), nullable=True)
    langchain_params = Column(JSON, default={})
    
    # For CrewAI tools
    crewai_tool_name = Column(String(255), nullable=True)
    crewai_params = Column(JSON, default={})
    
    # For custom tools
    python_code = Column(Text, nullable=True)
    custom_params = Column(JSON, default={})
    
    # Tool configuration
    is_active = Column(Boolean, default=True)
    requires_api_key = Column(Boolean, default=False)
    api_key_name = Column(String(100), nullable=True)  # e.g., 'OPENAI_API_KEY', 'SERPAPI_API_KEY'
    
    # Metadata
    tags = Column(JSON, default=[])
    version = Column(String(20), default="1.0.0")
    author = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now()) 
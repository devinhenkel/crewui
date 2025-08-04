from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ToolBase(BaseModel):
    name: str = Field(..., description="Tool name")
    description: str = Field(..., description="Tool description")
    tool_type: str = Field(..., description="Tool type: langchain, custom, builtin, or crewai")
    category: str = Field(..., description="Tool category")
    
    # For LangChain tools
    langchain_tool_name: Optional[str] = Field(None, description="LangChain tool class name")
    langchain_params: Optional[Dict[str, Any]] = Field(default={}, description="LangChain tool parameters")
    
    # For CrewAI tools
    crewai_tool_name: Optional[str] = Field(None, description="CrewAI tool name")
    crewai_params: Optional[Dict[str, Any]] = Field(default={}, description="CrewAI tool parameters")
    
    # For custom tools
    python_code: Optional[str] = Field(None, description="Python code for custom tools")
    custom_params: Optional[Dict[str, Any]] = Field(default={}, description="Custom tool parameters")
    
    # Tool configuration
    is_active: bool = Field(default=True, description="Whether the tool is active")
    requires_api_key: bool = Field(default=False, description="Whether the tool requires an API key")
    api_key_name: Optional[str] = Field(None, description="Name of the required API key")
    
    # Metadata
    tags: Optional[List[str]] = Field(default=[], description="Tool tags")
    version: str = Field(default="1.0.0", description="Tool version")
    author: Optional[str] = Field(None, description="Tool author")

class ToolCreate(ToolBase):
    pass

class ToolUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tool_type: Optional[str] = None
    category: Optional[str] = None
    langchain_tool_name: Optional[str] = None
    langchain_params: Optional[Dict[str, Any]] = None
    crewai_tool_name: Optional[str] = None
    crewai_params: Optional[Dict[str, Any]] = None
    python_code: Optional[str] = None
    custom_params: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    requires_api_key: Optional[bool] = None
    api_key_name: Optional[str] = None
    tags: Optional[List[str]] = None
    version: Optional[str] = None
    author: Optional[str] = None

class ToolResponse(ToolBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ToolList(BaseModel):
    tools: List[ToolResponse]
    total: int
    skip: int
    limit: int

class ToolTestInput(BaseModel):
    input_data: Dict[str, Any] = Field(..., description="Test input data for the tool")

class ToolTestResponse(BaseModel):
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None 
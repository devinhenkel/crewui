from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import importlib.util
import sys
from io import StringIO
import contextlib

from app.core.database import get_db
from app.models.tool import Tool
from app.schemas.tool import ToolCreate, ToolUpdate, ToolResponse, ToolList
from app.core.crewai_tools import get_crewai_tools, get_crewai_tool_categories

router = APIRouter()

# Pre-built LangChain tools library
LANGCHAIN_TOOLS = {
    "web_search": {
        "name": "DuckDuckGo Search",
        "description": "Search the web using DuckDuckGo",
        "category": "web_search",
        "langchain_tool_name": "DuckDuckGoSearchRun",
        "langchain_params": {},
        "requires_api_key": False
    },
    "serpapi_search": {
        "name": "SerpAPI Search",
        "description": "Search the web using SerpAPI",
        "category": "web_search",
        "langchain_tool_name": "SerpAPIWrapper",
        "langchain_params": {},
        "requires_api_key": True,
        "api_key_name": "SERPAPI_API_KEY"
    },
    "wikipedia": {
        "name": "Wikipedia Search",
        "description": "Search Wikipedia for information",
        "category": "information",
        "langchain_tool_name": "WikipediaQueryRun",
        "langchain_params": {},
        "requires_api_key": False
    },
    "calculator": {
        "name": "Calculator",
        "description": "Perform mathematical calculations",
        "category": "utilities",
        "langchain_tool_name": "LLMMathChain",
        "langchain_params": {},
        "requires_api_key": False
    },
    "file_reader": {
        "name": "File Reader",
        "description": "Read text files",
        "category": "file_operations",
        "langchain_tool_name": "ReadFileTool",
        "langchain_params": {},
        "requires_api_key": False
    },
    "file_writer": {
        "name": "File Writer",
        "description": "Write text to files",
        "category": "file_operations",
        "langchain_tool_name": "WriteFileTool",
        "langchain_params": {},
        "requires_api_key": False
    },
    "python_repl": {
        "name": "Python REPL",
        "description": "Execute Python code",
        "category": "programming",
        "langchain_tool_name": "PythonREPLTool",
        "langchain_params": {},
        "requires_api_key": False
    },
    "shell": {
        "name": "Shell Command",
        "description": "Execute shell commands",
        "category": "system",
        "langchain_tool_name": "ShellTool",
        "langchain_params": {},
        "requires_api_key": False
    },
    "requests_get": {
        "name": "HTTP GET Request",
        "description": "Make HTTP GET requests",
        "category": "web",
        "langchain_tool_name": "RequestsGetTool",
        "langchain_params": {},
        "requires_api_key": False
    },
    "requests_post": {
        "name": "HTTP POST Request",
        "description": "Make HTTP POST requests",
        "category": "web",
        "langchain_tool_name": "RequestsPostTool",
        "langchain_params": {},
        "requires_api_key": False
    }
}

# CrewAI tools library
CREWAI_TOOLS = get_crewai_tools()

@router.get("/", response_model=List[ToolResponse])
async def get_tools(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[str] = Query(None),
    tool_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """Get all tools with optional filtering"""
    query = db.query(Tool)
    
    if category:
        query = query.filter(Tool.category == category)
    if tool_type:
        query = query.filter(Tool.tool_type == tool_type)
    if search:
        query = query.filter(Tool.name.contains(search) | Tool.description.contains(search))
    
    tools = query.offset(skip).limit(limit).all()
    return tools

@router.get("/categories")
async def get_tool_categories(db: Session = Depends(get_db)):
    """Get all available tool categories"""
    categories = db.query(Tool.category).distinct().all()
    return [category[0] for category in categories]

@router.get("/types")
async def get_tool_types(db: Session = Depends(get_db)):
    """Get all available tool types"""
    types = db.query(Tool.tool_type).distinct().all()
    return [type[0] for type in types]

@router.get("/langchain-library")
async def get_langchain_library():
    """Get the pre-built LangChain tools library"""
    return LANGCHAIN_TOOLS

@router.get("/crewai-library")
async def get_crewai_library():
    """Get the pre-built CrewAI tools library"""
    return CREWAI_TOOLS

@router.post("/langchain/{tool_key}")
async def add_langchain_tool(
    tool_key: str,
    db: Session = Depends(get_db)
):
    """Add a pre-built LangChain tool to the database"""
    if tool_key not in LANGCHAIN_TOOLS:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_key}' not found in LangChain library")
    
    tool_data = LANGCHAIN_TOOLS[tool_key]
    
    # Check if tool already exists
    existing_tool = db.query(Tool).filter(Tool.name == tool_data["name"]).first()
    if existing_tool:
        raise HTTPException(status_code=400, detail="Tool already exists")
    
    # Create new tool
    tool = Tool(
        name=tool_data["name"],
        description=tool_data["description"],
        tool_type="langchain",
        category=tool_data["category"],
        langchain_tool_name=tool_data["langchain_tool_name"],
        langchain_params=tool_data.get("langchain_params", {}),
        requires_api_key=tool_data.get("requires_api_key", False),
        api_key_name=tool_data.get("api_key_name"),
        tags=[tool_data["category"], "langchain"]
    )
    
    db.add(tool)
    db.commit()
    db.refresh(tool)
    return tool

@router.post("/crewai/{tool_key}")
async def add_crewai_tool(
    tool_key: str,
    db: Session = Depends(get_db)
):
    """Add a pre-built CrewAI tool to the database"""
    if tool_key not in CREWAI_TOOLS:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_key}' not found in CrewAI library")
    
    tool_data = CREWAI_TOOLS[tool_key]
    
    # Check if tool already exists
    existing_tool = db.query(Tool).filter(Tool.name == tool_data["name"]).first()
    if existing_tool:
        raise HTTPException(status_code=400, detail="Tool already exists")
    
    # Create new tool
    tool = Tool(
        name=tool_data["name"],
        description=tool_data["description"],
        tool_type="crewai",
        category=tool_data["category"],
        crewai_tool_name=tool_data["crewai_tool_name"],
        crewai_params=tool_data.get("crewai_params", {}),
        requires_api_key=tool_data.get("requires_api_key", False),
        api_key_name=tool_data.get("api_key_name"),
        tags=tool_data.get("tags", [tool_data["category"], "crewai"])
    )
    
    db.add(tool)
    db.commit()
    db.refresh(tool)
    return tool

@router.post("/", response_model=ToolResponse)
async def create_tool(
    tool: ToolCreate,
    db: Session = Depends(get_db)
):
    """Create a new custom tool"""
    # Check if tool name already exists
    existing_tool = db.query(Tool).filter(Tool.name == tool.name).first()
    if existing_tool:
        raise HTTPException(status_code=400, detail="Tool name already exists")
    
    # Validate Python code if it's a custom tool
    if tool.tool_type == "custom" and tool.python_code:
        try:
            # Basic syntax validation
            compile(tool.python_code, '<string>', 'exec')
        except SyntaxError as e:
            raise HTTPException(status_code=400, detail=f"Invalid Python code: {str(e)}")
    
    db_tool = Tool(**tool.dict())
    db.add(db_tool)
    db.commit()
    db.refresh(db_tool)
    return db_tool

@router.get("/{tool_id}", response_model=ToolResponse)
async def get_tool(tool_id: int, db: Session = Depends(get_db)):
    """Get a specific tool by ID"""
    tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool

@router.put("/{tool_id}", response_model=ToolResponse)
async def update_tool(
    tool_id: int,
    tool_update: ToolUpdate,
    db: Session = Depends(get_db)
):
    """Update a tool"""
    db_tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if not db_tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    # Validate Python code if it's being updated
    if tool_update.python_code:
        try:
            compile(tool_update.python_code, '<string>', 'exec')
        except SyntaxError as e:
            raise HTTPException(status_code=400, detail=f"Invalid Python code: {str(e)}")
    
    for field, value in tool_update.dict(exclude_unset=True).items():
        setattr(db_tool, field, value)
    
    db.commit()
    db.refresh(db_tool)
    return db_tool

@router.delete("/{tool_id}")
async def delete_tool(tool_id: int, db: Session = Depends(get_db)):
    """Delete a tool"""
    tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    db.delete(tool)
    db.commit()
    return {"message": "Tool deleted successfully"}

@router.post("/{tool_id}/test")
async def test_tool(
    tool_id: int,
    test_input: dict,
    db: Session = Depends(get_db)
):
    """Test a custom tool with sample input"""
    tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    if tool.tool_type != "custom":
        raise HTTPException(status_code=400, detail="Only custom tools can be tested")
    
    if not tool.python_code:
        raise HTTPException(status_code=400, detail="Tool has no Python code")
    
    try:
        # Create a safe execution environment
        local_vars = {
            'input_data': test_input,
            'result': None,
            'error': None
        }
        
        # Execute the tool code
        exec(tool.python_code, {}, local_vars)
        
        return {
            "success": True,
            "result": local_vars.get('result'),
            "error": local_vars.get('error')
        }
    except Exception as e:
        return {
            "success": False,
            "result": None,
            "error": str(e)
        } 
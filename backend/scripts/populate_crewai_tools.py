#!/usr/bin/env python3
"""
Script to populate the database with CrewAI tools for testing
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.tool import Tool
from app.core.crewai_tools import get_crewai_tools

def populate_crewai_tools():
    """Add some CrewAI tools to the database for testing"""
    db = SessionLocal()
    
    try:
        crewai_tools = get_crewai_tools()
        
        # Add a few key tools for testing
        test_tools = [
            'web_search',
            'file_reader', 
            'file_writer',
            'calculator',
            'wikipedia_search',
            'data_analyzer'
        ]
        
        added_count = 0
        for tool_key in test_tools:
            if tool_key in crewai_tools:
                tool_data = crewai_tools[tool_key]
                
                # Check if tool already exists
                existing_tool = db.query(Tool).filter(Tool.name == tool_data["name"]).first()
                if existing_tool:
                    print(f"Tool '{tool_data['name']}' already exists, skipping...")
                    continue
                
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
                    tags=tool_data.get("tags", [tool_data["category"], "crewai"]),
                    version=tool_data.get("version", "1.0.0"),
                    author=tool_data.get("author", "CrewAI")
                )
                
                db.add(tool)
                added_count += 1
                print(f"Added tool: {tool_data['name']}")
        
        db.commit()
        print(f"\nSuccessfully added {added_count} CrewAI tools to the database!")
        
    except Exception as e:
        print(f"Error populating tools: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate_crewai_tools() 
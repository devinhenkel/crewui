"""
CrewAI Tools Library

This module contains a comprehensive collection of CrewAI tools that can be used
in process steps. These tools are designed to work with CrewAI agents and provide
various capabilities for different types of tasks.
"""

from typing import Dict, Any, List

# CrewAI Tools Library
CREWAI_TOOLS = {
    # Web Search and Information Tools
    "web_search": {
        "name": "Web Search",
        "description": "Search the web for current information using DuckDuckGo",
        "category": "web_search",
        "tool_type": "crewai",
        "crewai_tool_name": "web_search",
        "crewai_params": {
            "search_engine": "duckduckgo",
            "max_results": 5
        },
        "requires_api_key": False,
        "tags": ["web", "search", "information"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    "serpapi_search": {
        "name": "SerpAPI Search",
        "description": "Advanced web search using SerpAPI with structured results",
        "category": "web_search",
        "tool_type": "crewai",
        "crewai_tool_name": "serpapi_search",
        "crewai_params": {
            "search_engine": "google",
            "max_results": 10
        },
        "requires_api_key": True,
        "api_key_name": "SERPAPI_API_KEY",
        "tags": ["web", "search", "advanced"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    # File Operations
    "file_reader": {
        "name": "File Reader",
        "description": "Read and extract content from text files",
        "category": "file_operations",
        "tool_type": "crewai",
        "crewai_tool_name": "file_reader",
        "crewai_params": {
            "encoding": "utf-8",
            "max_file_size": "10MB"
        },
        "requires_api_key": False,
        "tags": ["file", "read", "text"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    "file_writer": {
        "name": "File Writer",
        "description": "Write content to text files",
        "category": "file_operations",
        "tool_type": "crewai",
        "crewai_tool_name": "file_writer",
        "crewai_params": {
            "encoding": "utf-8",
            "overwrite": True
        },
        "requires_api_key": False,
        "tags": ["file", "write", "text"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    "csv_reader": {
        "name": "CSV Reader",
        "description": "Read and parse CSV files",
        "category": "file_operations",
        "tool_type": "crewai",
        "crewai_tool_name": "csv_reader",
        "crewai_params": {
            "delimiter": ",",
            "encoding": "utf-8"
        },
        "requires_api_key": False,
        "tags": ["file", "csv", "data"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    "csv_writer": {
        "name": "CSV Writer",
        "description": "Write data to CSV files",
        "category": "file_operations",
        "tool_type": "crewai",
        "crewai_tool_name": "csv_writer",
        "crewai_params": {
            "delimiter": ",",
            "encoding": "utf-8"
        },
        "requires_api_key": False,
        "tags": ["file", "csv", "data"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    # Data Analysis and Processing
    "data_analyzer": {
        "name": "Data Analyzer",
        "description": "Analyze datasets and generate insights",
        "category": "data_analysis",
        "tool_type": "crewai",
        "crewai_tool_name": "data_analyzer",
        "crewai_params": {
            "analysis_types": ["summary", "correlation", "outliers"],
            "output_format": "json"
        },
        "requires_api_key": False,
        "tags": ["data", "analysis", "insights"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    "chart_generator": {
        "name": "Chart Generator",
        "description": "Generate charts and visualizations from data",
        "category": "data_analysis",
        "tool_type": "crewai",
        "crewai_tool_name": "chart_generator",
        "crewai_params": {
            "chart_types": ["bar", "line", "pie", "scatter"],
            "output_format": "png"
        },
        "requires_api_key": False,
        "tags": ["data", "visualization", "charts"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    # Communication Tools
    "email_sender": {
        "name": "Email Sender",
        "description": "Send emails using SMTP",
        "category": "communication",
        "tool_type": "crewai",
        "crewai_tool_name": "email_sender",
        "crewai_params": {
            "smtp_server": "smtp.gmail.com",
            "smtp_port": 587
        },
        "requires_api_key": True,
        "api_key_name": "EMAIL_PASSWORD",
        "tags": ["email", "communication"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    "slack_notifier": {
        "name": "Slack Notifier",
        "description": "Send notifications to Slack channels",
        "category": "communication",
        "tool_type": "crewai",
        "crewai_tool_name": "slack_notifier",
        "crewai_params": {
            "channel": "general",
            "username": "CrewAI Bot"
        },
        "requires_api_key": True,
        "api_key_name": "SLACK_BOT_TOKEN",
        "tags": ["slack", "notification"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    # Code and Development
    "code_analyzer": {
        "name": "Code Analyzer",
        "description": "Analyze and review code for quality and issues",
        "category": "programming",
        "tool_type": "crewai",
        "crewai_tool_name": "code_analyzer",
        "crewai_params": {
            "languages": ["python", "javascript", "java"],
            "analysis_types": ["complexity", "style", "security"]
        },
        "requires_api_key": False,
        "tags": ["code", "analysis", "review"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    "git_operations": {
        "name": "Git Operations",
        "description": "Perform Git operations like commit, push, pull",
        "category": "programming",
        "tool_type": "crewai",
        "crewai_tool_name": "git_operations",
        "crewai_params": {
            "operations": ["commit", "push", "pull", "status"],
            "auto_commit": False
        },
        "requires_api_key": False,
        "tags": ["git", "version_control"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    # System and Utilities
    "system_info": {
        "name": "System Information",
        "description": "Get system information and status",
        "category": "system",
        "tool_type": "crewai",
        "crewai_tool_name": "system_info",
        "crewai_params": {
            "info_types": ["cpu", "memory", "disk", "network"]
        },
        "requires_api_key": False,
        "tags": ["system", "monitoring"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    "process_monitor": {
        "name": "Process Monitor",
        "description": "Monitor and manage system processes",
        "category": "system",
        "tool_type": "crewai",
        "crewai_tool_name": "process_monitor",
        "crewai_params": {
            "monitor_types": ["cpu_usage", "memory_usage", "status"]
        },
        "requires_api_key": False,
        "tags": ["system", "process", "monitoring"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    # API and Web Services
    "api_client": {
        "name": "API Client",
        "description": "Make HTTP requests to external APIs",
        "category": "web",
        "tool_type": "crewai",
        "crewai_tool_name": "api_client",
        "crewai_params": {
            "methods": ["GET", "POST", "PUT", "DELETE"],
            "timeout": 30
        },
        "requires_api_key": False,
        "tags": ["api", "http", "web"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    "json_parser": {
        "name": "JSON Parser",
        "description": "Parse and manipulate JSON data",
        "category": "utilities",
        "tool_type": "crewai",
        "crewai_tool_name": "json_parser",
        "crewai_params": {
            "operations": ["parse", "validate", "transform"]
        },
        "requires_api_key": False,
        "tags": ["json", "data", "utilities"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    # Research and Information
    "wikipedia_search": {
        "name": "Wikipedia Search",
        "description": "Search Wikipedia for information",
        "category": "information",
        "tool_type": "crewai",
        "crewai_tool_name": "wikipedia_search",
        "crewai_params": {
            "language": "en",
            "max_results": 5
        },
        "requires_api_key": False,
        "tags": ["wikipedia", "research", "information"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    "news_aggregator": {
        "name": "News Aggregator",
        "description": "Aggregate and summarize news from various sources",
        "category": "information",
        "tool_type": "crewai",
        "crewai_tool_name": "news_aggregator",
        "crewai_params": {
            "sources": ["reuters", "ap", "bbc"],
            "max_articles": 10
        },
        "requires_api_key": False,
        "tags": ["news", "aggregation", "information"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    # Mathematical and Computational
    "calculator": {
        "name": "Calculator",
        "description": "Perform mathematical calculations",
        "category": "utilities",
        "tool_type": "crewai",
        "crewai_tool_name": "calculator",
        "crewai_params": {
            "precision": 10,
            "operations": ["basic", "scientific", "statistical"]
        },
        "requires_api_key": False,
        "tags": ["math", "calculation", "utilities"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    "statistical_analyzer": {
        "name": "Statistical Analyzer",
        "description": "Perform statistical analysis on datasets",
        "category": "data_analysis",
        "tool_type": "crewai",
        "crewai_tool_name": "statistical_analyzer",
        "crewai_params": {
            "tests": ["t_test", "chi_square", "correlation"],
            "confidence_level": 0.95
        },
        "requires_api_key": False,
        "tags": ["statistics", "analysis", "data"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    # Content Generation
    "text_summarizer": {
        "name": "Text Summarizer",
        "description": "Summarize long text content",
        "category": "content",
        "tool_type": "crewai",
        "crewai_tool_name": "text_summarizer",
        "crewai_params": {
            "max_length": 200,
            "style": "concise"
        },
        "requires_api_key": False,
        "tags": ["text", "summarization", "content"],
        "version": "1.0.0",
        "author": "CrewAI"
    },
    
    "content_generator": {
        "name": "Content Generator",
        "description": "Generate various types of content",
        "category": "content",
        "tool_type": "crewai",
        "crewai_tool_name": "content_generator",
        "crewai_params": {
            "content_types": ["article", "report", "email", "social_media"],
            "tone": "professional"
        },
        "requires_api_key": False,
        "tags": ["content", "generation", "writing"],
        "version": "1.0.0",
        "author": "CrewAI"
    }
}

def get_crewai_tools() -> Dict[str, Any]:
    """Get all available CrewAI tools"""
    return CREWAI_TOOLS

def get_crewai_tool_categories() -> List[str]:
    """Get all available CrewAI tool categories"""
    categories = set()
    for tool in CREWAI_TOOLS.values():
        categories.add(tool["category"])
    return sorted(list(categories))

def get_crewai_tool_by_name(name: str) -> Dict[str, Any]:
    """Get a specific CrewAI tool by name"""
    for tool_key, tool_data in CREWAI_TOOLS.items():
        if tool_data["name"] == name:
            return tool_data
    return None 
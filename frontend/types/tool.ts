export interface Tool {
  id: number;
  name: string;
  description: string;
  tool_type: 'langchain' | 'custom' | 'builtin' | 'crewai';
  category: string;
  
  // For LangChain tools
  langchain_tool_name?: string;
  langchain_params?: Record<string, any>;
  
  // For CrewAI tools
  crewai_tool_name?: string;
  crewai_params?: Record<string, any>;
  
  // For custom tools
  python_code?: string;
  custom_params?: Record<string, any>;
  
  // Tool configuration
  is_active: boolean;
  requires_api_key: boolean;
  api_key_name?: string;
  
  // Metadata
  tags: string[];
  version: string;
  author?: string;
  
  created_at: string;
  updated_at: string;
}

export interface ToolCreate {
  name: string;
  description: string;
  tool_type: 'langchain' | 'custom' | 'builtin';
  category: string;
  langchain_tool_name?: string;
  langchain_params?: Record<string, any>;
  python_code?: string;
  custom_params?: Record<string, any>;
  is_active?: boolean;
  requires_api_key?: boolean;
  api_key_name?: string;
  tags?: string[];
  version?: string;
  author?: string;
}

export interface ToolUpdate {
  name?: string;
  description?: string;
  tool_type?: 'langchain' | 'custom' | 'builtin';
  category?: string;
  langchain_tool_name?: string;
  langchain_params?: Record<string, any>;
  python_code?: string;
  custom_params?: Record<string, any>;
  is_active?: boolean;
  requires_api_key?: boolean;
  api_key_name?: string;
  tags?: string[];
  version?: string;
  author?: string;
}

export interface ToolFilters {
  search?: string;
  category?: string;
  tool_type?: string;
  skip?: number;
  limit?: number;
}

export interface LangChainTool {
  name: string;
  description: string;
  category: string;
  langchain_tool_name: string;
  langchain_params: Record<string, any>;
  requires_api_key: boolean;
  api_key_name?: string;
}

export interface ToolTestInput {
  input_data: Record<string, any>;
}

export interface ToolTestResponse {
  success: boolean;
  result?: any;
  error?: string;
} 
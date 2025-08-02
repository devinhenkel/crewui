export interface Agent {
  id: number;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  tools: any[];
  llm_config: Record<string, any>;
  additional_params: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AgentCreate {
  name: string;
  role: string;
  goal: string;
  backstory: string;
  tools?: any[];
  llm_config?: Record<string, any>;
  additional_params?: Record<string, any>;
}

export interface AgentUpdate {
  name?: string;
  role?: string;
  goal?: string;
  backstory?: string;
  tools?: any[];
  llm_config?: Record<string, any>;
  additional_params?: Record<string, any>;
}

export interface AgentFilters {
  search?: string;
  skip?: number;
  limit?: number;
} 
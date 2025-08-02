export interface Task {
  id: number;
  name: string;
  description: string;
  expected_output: string;
  tools: any[];
  context: Record<string, any>;
  additional_params: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  name: string;
  description: string;
  expected_output: string;
  tools?: any[];
  context?: Record<string, any>;
  additional_params?: Record<string, any>;
}

export interface TaskUpdate {
  name?: string;
  description?: string;
  expected_output?: string;
  tools?: any[];
  context?: Record<string, any>;
  additional_params?: Record<string, any>;
}

export interface TaskFilters {
  search?: string;
  skip?: number;
  limit?: number;
} 
export interface Process {
  id: number;
  name: string;
  description: string | null;
  process_type: 'sequential' | 'hierarchical';
  configuration: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProcessCreate {
  name: string;
  description?: string;
  process_type: 'sequential' | 'hierarchical';
  configuration: Record<string, any>;
}

export interface ProcessUpdate {
  name?: string;
  description?: string;
  process_type?: 'sequential' | 'hierarchical';
  configuration?: Record<string, any>;
}

export interface ProcessFilters {
  search?: string;
  skip?: number;
  limit?: number;
}

// Process configuration types
export interface ProcessStep {
  id: string;
  task_id: number;
  agent_id: number;
  order?: number;
  dependencies?: string[];
  tools?: number[]; // Array of tool IDs
}

export interface SequentialProcessConfig {
  steps: ProcessStep[];
}

export interface HierarchicalProcessConfig {
  tasks: ProcessStep[];
  hierarchy: Record<string, string[]>; // parent -> children mapping
}

export type ProcessConfiguration = SequentialProcessConfig | HierarchicalProcessConfig; 
export interface Execution {
  id: number;
  process_id: number;
  status: 'running' | 'completed' | 'failed' | 'stopped' | 'pending';
  output_path?: string;
  console_log?: string;
  started_at: string;
  completed_at?: string;
  process?: {
    id: number;
    name: string;
    description?: string;
    process_type: string;
  };
}

export interface ExecutionFilters {
  skip?: number;
  limit?: number;
}

export interface ExecutionUpdate {
  status?: string;
  output_path?: string;
  console_log?: string;
  completed_at?: string;
}

export interface ExecutionRequest {
  variables: Record<string, string>;
} 
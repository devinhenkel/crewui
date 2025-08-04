import axios from 'axios';
import { getApiUrl } from '@/lib/config';

const API_BASE_URL = getApiUrl();

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

export const executionsApi = {
  // Get all executions
  async getExecutions(filters: ExecutionFilters = {}): Promise<Execution[]> {
    const params = new URLSearchParams();
    if (filters.skip !== undefined) params.append('skip', filters.skip.toString());
    if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
    
    const response = await axios.get(`${API_BASE_URL}/executions/?${params.toString()}`);
    return response.data;
  },

  // Get a specific execution
  async getExecution(id: number): Promise<Execution> {
    const response = await axios.get(`${API_BASE_URL}/executions/${id}`);
    return response.data;
  },

  // Update an execution
  async updateExecution(id: number, execution: ExecutionUpdate): Promise<Execution> {
    const response = await axios.put(`${API_BASE_URL}/executions/${id}`, execution);
    return response.data;
  },

  // Delete an execution
  async deleteExecution(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/executions/${id}`);
  },

  // Stop a running execution
  async stopExecution(id: number): Promise<Execution> {
    const response = await axios.post(`${API_BASE_URL}/executions/${id}/stop`);
    return response.data;
  },

  // Get executions for a specific process
  async getProcessExecutions(processId: number): Promise<Execution[]> {
    const response = await axios.get(`${API_BASE_URL}/executions/process/${processId}`);
    return response.data;
  },
}; 
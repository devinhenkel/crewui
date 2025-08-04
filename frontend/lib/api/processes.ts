import axios from 'axios';
import { Process, ProcessCreate, ProcessUpdate, ProcessFilters } from '@/types/process';
import { ExecutionRequest } from '@/types/execution';
import { getApiUrl } from '@/lib/config';

const API_BASE_URL = getApiUrl();

export const processesApi = {
  // Get all processes with optional filters
  async getProcesses(filters: ProcessFilters = {}): Promise<Process[]> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.skip) params.append('skip', filters.skip.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const response = await axios.get(`${API_BASE_URL}/processes?${params}`);
    return response.data;
  },

  // Get a single process by ID
  async getProcess(id: number): Promise<Process> {
    const response = await axios.get(`${API_BASE_URL}/processes/${id}`);
    return response.data;
  },

  // Create a new process
  async createProcess(process: ProcessCreate): Promise<Process> {
    const response = await axios.post(`${API_BASE_URL}/processes`, process);
    return response.data;
  },

  // Update a process
  async updateProcess(id: number, process: ProcessUpdate): Promise<Process> {
    const response = await axios.put(`${API_BASE_URL}/processes/${id}`, process);
    return response.data;
  },

  // Delete a process
  async deleteProcess(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/processes/${id}`);
  },

  // Execute a process with variables
  async executeProcess(id: number, variables: Record<string, string> = {}): Promise<{ execution_id: number; message: string; status: string }> {
    const executionRequest: ExecutionRequest = { variables };
    const response = await axios.post(`${API_BASE_URL}/processes/${id}/execute`, executionRequest);
    return response.data;
  },
}; 
import axios from 'axios';
import { Task, TaskCreate, TaskUpdate, TaskFilters } from '@/types/task';
import { getApiUrl } from '@/lib/config';

const API_BASE_URL = getApiUrl();

export const tasksApi = {
  // Get all tasks with optional filters
  async getTasks(filters: TaskFilters = {}): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.skip) params.append('skip', filters.skip.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const response = await axios.get(`${API_BASE_URL}/tasks?${params}`);
    return response.data;
  },

  // Get a single task by ID
  async getTask(id: number): Promise<Task> {
    const response = await axios.get(`${API_BASE_URL}/tasks/${id}`);
    return response.data;
  },

  // Create a new task
  async createTask(task: TaskCreate): Promise<Task> {
    const response = await axios.post(`${API_BASE_URL}/tasks`, task);
    return response.data;
  },

  // Update a task
  async updateTask(id: number, task: TaskUpdate): Promise<Task> {
    const response = await axios.put(`${API_BASE_URL}/tasks/${id}`, task);
    return response.data;
  },

  // Delete a task
  async deleteTask(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/tasks/${id}`);
  },
}; 
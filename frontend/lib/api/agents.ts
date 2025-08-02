import axios from 'axios';
import { Agent, AgentCreate, AgentUpdate, AgentFilters } from '@/types/agent';
import { getApiUrl } from '@/lib/config';

const API_BASE_URL = getApiUrl();

export const agentsApi = {
  // Get all agents with optional filters
  async getAgents(filters: AgentFilters = {}): Promise<Agent[]> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.skip) params.append('skip', filters.skip.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const response = await axios.get(`${API_BASE_URL}/agents?${params}`);
    return response.data;
  },

  // Get a single agent by ID
  async getAgent(id: number): Promise<Agent> {
    const response = await axios.get(`${API_BASE_URL}/agents/${id}`);
    return response.data;
  },

  // Create a new agent
  async createAgent(agent: AgentCreate): Promise<Agent> {
    const response = await axios.post(`${API_BASE_URL}/agents`, agent);
    return response.data;
  },

  // Update an agent
  async updateAgent(id: number, agent: AgentUpdate): Promise<Agent> {
    const response = await axios.put(`${API_BASE_URL}/agents/${id}`, agent);
    return response.data;
  },

  // Delete an agent
  async deleteAgent(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/agents/${id}`);
  },
}; 
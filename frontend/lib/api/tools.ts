import axios from 'axios';
import { Tool, ToolCreate, ToolUpdate, ToolFilters, LangChainTool, ToolTestInput, ToolTestResponse } from '@/types/tool';
import { getApiUrl } from '@/lib/config';

const API_BASE_URL = getApiUrl();

export const toolsApi = {
  // Get all tools with optional filters
  async getTools(filters: ToolFilters = {}): Promise<Tool[]> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.tool_type) params.append('tool_type', filters.tool_type);
    if (filters.skip) params.append('skip', filters.skip.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const response = await axios.get(`${API_BASE_URL}/tools?${params}`);
    return response.data;
  },

  // Get a single tool by ID
  async getTool(id: number): Promise<Tool> {
    const response = await axios.get(`${API_BASE_URL}/tools/${id}`);
    return response.data;
  },

  // Create a new tool
  async createTool(tool: ToolCreate): Promise<Tool> {
    const response = await axios.post(`${API_BASE_URL}/tools`, tool);
    return response.data;
  },

  // Update a tool
  async updateTool(id: number, tool: ToolUpdate): Promise<Tool> {
    const response = await axios.put(`${API_BASE_URL}/tools/${id}`, tool);
    return response.data;
  },

  // Delete a tool
  async deleteTool(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/tools/${id}`);
  },

  // Get tool categories
  async getToolCategories(): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/tools/categories`);
    return response.data;
  },

  // Get tool types
  async getToolTypes(): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/tools/types`);
    return response.data;
  },

  // Get LangChain tools library
  async getLangChainLibrary(): Promise<Record<string, LangChainTool>> {
    const response = await axios.get(`${API_BASE_URL}/tools/langchain-library`);
    return response.data;
  },

  // Add a LangChain tool to the database
  async addLangChainTool(toolKey: string): Promise<Tool> {
    const response = await axios.post(`${API_BASE_URL}/tools/langchain/${toolKey}`);
    return response.data;
  },

  // Get CrewAI tools library
  async getCrewAILibrary(): Promise<Record<string, any>> {
    const response = await axios.get(`${API_BASE_URL}/tools/crewai-library`);
    return response.data;
  },

  // Add a CrewAI tool to the database
  async addCrewAITool(toolKey: string): Promise<Tool> {
    const response = await axios.post(`${API_BASE_URL}/tools/crewai/${toolKey}`);
    return response.data;
  },

  // Test a custom tool
  async testTool(id: number, testInput: ToolTestInput): Promise<ToolTestResponse> {
    const response = await axios.post(`${API_BASE_URL}/tools/${id}/test`, testInput);
    return response.data;
  },
}; 
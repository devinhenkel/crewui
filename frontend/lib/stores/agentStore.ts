import { create } from 'zustand';
import { Agent, AgentCreate, AgentUpdate, AgentFilters } from '@/types/agent';
import { agentsApi } from '@/lib/api/agents';

interface AgentState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  selectedAgent: Agent | null;
  
  // Actions
  fetchAgents: (filters?: AgentFilters) => Promise<void>;
  fetchAgent: (id: number) => Promise<void>;
  createAgent: (agent: AgentCreate) => Promise<void>;
  updateAgent: (id: number, agent: AgentUpdate) => Promise<void>;
  deleteAgent: (id: number) => Promise<void>;
  setSelectedAgent: (agent: Agent | null) => void;
  clearError: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  loading: false,
  error: null,
  selectedAgent: null,

  fetchAgents: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const agents = await agentsApi.getAgents(filters);
      set({ agents, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch agents', 
        loading: false 
      });
    }
  },

  fetchAgent: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const agent = await agentsApi.getAgent(id);
      set({ selectedAgent: agent, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch agent', 
        loading: false 
      });
    }
  },

  createAgent: async (agent: AgentCreate) => {
    set({ loading: true, error: null });
    try {
      const newAgent = await agentsApi.createAgent(agent);
      set(state => ({ 
        agents: [...state.agents, newAgent], 
        loading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create agent', 
        loading: false 
      });
    }
  },

  updateAgent: async (id: number, agent: AgentUpdate) => {
    set({ loading: true, error: null });
    try {
      const updatedAgent = await agentsApi.updateAgent(id, agent);
      set(state => ({ 
        agents: state.agents.map(a => a.id === id ? updatedAgent : a),
        selectedAgent: state.selectedAgent?.id === id ? updatedAgent : state.selectedAgent,
        loading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update agent', 
        loading: false 
      });
    }
  },

  deleteAgent: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await agentsApi.deleteAgent(id);
      set(state => ({ 
        agents: state.agents.filter(a => a.id !== id),
        selectedAgent: state.selectedAgent?.id === id ? null : state.selectedAgent,
        loading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete agent', 
        loading: false 
      });
    }
  },

  setSelectedAgent: (agent: Agent | null) => {
    set({ selectedAgent: agent });
  },

  clearError: () => {
    set({ error: null });
  },
})); 
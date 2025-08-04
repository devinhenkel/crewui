import { create } from 'zustand';
import { Execution, ExecutionFilters } from '@/lib/api/executions';
import { executionsApi } from '@/lib/api/executions';

interface ExecutionStore {
  executions: Execution[];
  currentExecution: Execution | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchExecutions: (filters?: ExecutionFilters) => Promise<void>;
  fetchExecution: (id: number) => Promise<void>;
  fetchProcessExecutions: (processId: number) => Promise<void>;
  stopExecution: (id: number) => Promise<void>;
  deleteExecution: (id: number) => Promise<void>;
  updateExecution: (id: number, execution: Partial<Execution>) => Promise<void>;
  setCurrentExecution: (execution: Execution | null) => void;
  clearError: () => void;
}

export const useExecutionStore = create<ExecutionStore>((set, get) => ({
  executions: [],
  currentExecution: null,
  loading: false,
  error: null,

  fetchExecutions: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const executions = await executionsApi.getExecutions(filters);
      set({ executions, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch executions', 
        loading: false 
      });
    }
  },

  fetchExecution: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const execution = await executionsApi.getExecution(id);
      set({ currentExecution: execution, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch execution', 
        loading: false 
      });
    }
  },

  fetchProcessExecutions: async (processId: number) => {
    set({ loading: true, error: null });
    try {
      const executions = await executionsApi.getProcessExecutions(processId);
      set({ executions, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch process executions', 
        loading: false 
      });
    }
  },

  stopExecution: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const updatedExecution = await executionsApi.stopExecution(id);
      set(state => ({
        executions: state.executions.map(e => e.id === id ? updatedExecution : e),
        currentExecution: state.currentExecution?.id === id ? updatedExecution : state.currentExecution,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to stop execution', 
        loading: false 
      });
    }
  },

  deleteExecution: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await executionsApi.deleteExecution(id);
      set(state => ({
        executions: state.executions.filter(e => e.id !== id),
        currentExecution: state.currentExecution?.id === id ? null : state.currentExecution,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete execution', 
        loading: false 
      });
    }
  },

  updateExecution: async (id: number, execution: Partial<Execution>) => {
    set({ loading: true, error: null });
    try {
      const updatedExecution = await executionsApi.updateExecution(id, execution);
      set(state => ({
        executions: state.executions.map(e => e.id === id ? updatedExecution : e),
        currentExecution: state.currentExecution?.id === id ? updatedExecution : state.currentExecution,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update execution', 
        loading: false 
      });
    }
  },

  setCurrentExecution: (execution: Execution | null) => {
    set({ currentExecution: execution });
  },

  clearError: () => {
    set({ error: null });
  },
})); 
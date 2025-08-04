import { create } from 'zustand';
import { Process, ProcessCreate, ProcessUpdate, ProcessFilters } from '@/types/process';
import { ExecutionRequest } from '@/types/execution';
import { processesApi } from '@/lib/api/processes';

interface ProcessStore {
  processes: Process[];
  loading: boolean;
  error: string | null;
  selectedProcess: Process | null;
  
  // Actions
  fetchProcesses: (filters?: ProcessFilters) => Promise<void>;
  fetchProcess: (id: number) => Promise<void>;
  createProcess: (process: ProcessCreate) => Promise<void>;
  updateProcess: (id: number, process: ProcessUpdate) => Promise<void>;
  deleteProcess: (id: number) => Promise<void>;
  executeProcess: (id: number, variables?: Record<string, string>) => Promise<{ execution_id: number }>;
  setSelectedProcess: (process: Process | null) => void;
  clearError: () => void;
}

export const useProcessStore = create<ProcessStore>((set, get) => ({
  processes: [],
  loading: false,
  error: null,
  selectedProcess: null,

  fetchProcesses: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const processes = await processesApi.getProcesses(filters);
      set({ processes, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch processes', 
        loading: false 
      });
    }
  },

  fetchProcess: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const process = await processesApi.getProcess(id);
      set({ selectedProcess: process, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch process', 
        loading: false 
      });
    }
  },

  createProcess: async (process: ProcessCreate) => {
    set({ loading: true, error: null });
    try {
      const newProcess = await processesApi.createProcess(process);
      set(state => ({ 
        processes: [...state.processes, newProcess], 
        loading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create process', 
        loading: false 
      });
    }
  },

  updateProcess: async (id: number, process: ProcessUpdate) => {
    set({ loading: true, error: null });
    try {
      const updatedProcess = await processesApi.updateProcess(id, process);
      set(state => ({
        processes: state.processes.map(p => p.id === id ? updatedProcess : p),
        selectedProcess: state.selectedProcess?.id === id ? updatedProcess : state.selectedProcess,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update process', 
        loading: false 
      });
    }
  },

  deleteProcess: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await processesApi.deleteProcess(id);
      set(state => ({
        processes: state.processes.filter(p => p.id !== id),
        selectedProcess: state.selectedProcess?.id === id ? null : state.selectedProcess,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete process', 
        loading: false 
      });
    }
  },

  executeProcess: async (id: number, variables: Record<string, string> = {}) => {
    set({ loading: true, error: null });
    try {
      const result = await processesApi.executeProcess(id, variables);
      set({ loading: false });
      return result;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to execute process', 
        loading: false 
      });
      throw error;
    }
  },

  setSelectedProcess: (process: Process | null) => {
    set({ selectedProcess: process });
  },

  clearError: () => {
    set({ error: null });
  },
})); 
import { create } from 'zustand';
import { Execution, ExecutionFilters } from '@/lib/api/executions';
import { executionsApi } from '@/lib/api/executions';
import { getApiUrl } from '@/lib/config';

interface ExecutionStore {
  executions: Execution[];
  currentExecution: Execution | null;
  loading: boolean;
  error: string | null;
  consoleOutput: string;
  
  // Actions
  startExecution: (processId: number, variables?: Record<string, string>) => Promise<void>;
  appendConsoleOutput: (output: string) => void;
  clearConsoleOutput: () => void;
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
  consoleOutput: "",

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

  startExecution: async (processId: number, variables?: Record<string, string>) => {
    console.log(`🚀 Frontend DEBUG: Starting execution for process ${processId}`, { variables });
    set({ loading: true, error: null, consoleOutput: "" });
    
    try {
      const url = `${getApiUrl()}/processes/${processId}/execute`;
      console.log(`🚀 Frontend DEBUG: Making request to ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variables: variables || {} }),
      });

      console.log(`🚀 Frontend DEBUG: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`❌ Frontend DEBUG: Response not ok: ${response.status} ${response.statusText}`);
        throw new Error('Failed to start execution');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        console.error(`❌ Frontend DEBUG: Failed to get response reader`);
        throw new Error('Failed to get response reader');
      }

      console.log(`✅ Frontend DEBUG: Starting to read stream...`);
      let chunkCount = 0;

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log(`✅ Frontend DEBUG: Stream reading completed after ${chunkCount} chunks`);
          break;
        }

        // Convert the chunk to text and append to console output
        const text = new TextDecoder().decode(value);
        chunkCount++;
        console.log(`📦 Frontend DEBUG: Chunk ${chunkCount}: ${text.substring(0, 100)}...`);
        
        // Parse SSE format (data: content)
        const lines = text.split('\n');
        let content = '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            content += line.substring(6) + '\n';
          }
        }
        
        if (content) {
          set(state => ({
            consoleOutput: state.consoleOutput + content
          }));
        }
      }

      set({ loading: false });
      console.log(`✅ Frontend DEBUG: Execution completed successfully`);
    } catch (error) {
      console.error(`❌ Frontend DEBUG: Execution error:`, error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to start execution',
        loading: false 
      });
    }
  },

  appendConsoleOutput: (output: string) => {
    set(state => ({
      consoleOutput: state.consoleOutput + output
    }));
  },

  clearConsoleOutput: () => {
    set({ consoleOutput: "" });
  },
})); 
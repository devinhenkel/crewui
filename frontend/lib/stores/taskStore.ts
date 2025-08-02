import { create } from 'zustand';
import { Task, TaskCreate, TaskUpdate, TaskFilters } from '@/types/task';
import { tasksApi } from '@/lib/api/tasks';

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  selectedTask: Task | null;
  
  // Actions
  fetchTasks: (filters?: TaskFilters) => Promise<void>;
  fetchTask: (id: number) => Promise<void>;
  createTask: (task: TaskCreate) => Promise<void>;
  updateTask: (id: number, task: TaskUpdate) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  setSelectedTask: (task: Task | null) => void;
  clearError: () => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  selectedTask: null,

  fetchTasks: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const tasks = await tasksApi.getTasks(filters);
      set({ tasks, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch tasks', 
        loading: false 
      });
    }
  },

  fetchTask: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const task = await tasksApi.getTask(id);
      set({ selectedTask: task, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch task', 
        loading: false 
      });
    }
  },

  createTask: async (task: TaskCreate) => {
    set({ loading: true, error: null });
    try {
      const newTask = await tasksApi.createTask(task);
      set(state => ({ 
        tasks: [...state.tasks, newTask], 
        loading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create task', 
        loading: false 
      });
    }
  },

  updateTask: async (id: number, task: TaskUpdate) => {
    set({ loading: true, error: null });
    try {
      const updatedTask = await tasksApi.updateTask(id, task);
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? updatedTask : t),
        selectedTask: state.selectedTask?.id === id ? updatedTask : state.selectedTask,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update task', 
        loading: false 
      });
    }
  },

  deleteTask: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await tasksApi.deleteTask(id);
      set(state => ({
        tasks: state.tasks.filter(t => t.id !== id),
        selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete task', 
        loading: false 
      });
    }
  },

  setSelectedTask: (task: Task | null) => {
    set({ selectedTask: task });
  },

  clearError: () => {
    set({ error: null });
  },
})); 
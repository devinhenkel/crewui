'use client';

import { useState, useEffect } from 'react';
import { Task, TaskCreate, TaskUpdate } from '@/types/task';
import { useTaskStore } from '@/lib/stores/taskStore';
import { TaskForm } from './TaskForm';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, AlertCircle, Loader2 } from 'lucide-react';

export function TaskLibrary() {
  const {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    clearError,
  } = useTaskStore();

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchTasks({ search: value });
  };

  const handleCreateTask = async (data: TaskCreate | TaskUpdate) => {
    if ('name' in data && data.name && 'description' in data && data.description && 'expected_output' in data && data.expected_output) {
      await createTask(data as TaskCreate);
      setShowForm(false);
    }
  };

  const handleUpdateTask = async (data: TaskCreate | TaskUpdate) => {
    if (editingTask) {
      await updateTask(editingTask.id, data as TaskUpdate);
      setEditingTask(null);
    }
  };

  const handleDeleteTask = async (id: number) => {
    await deleteTask(id);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(false);
  };

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTask(null);
    setViewingTask(null);
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <Button onClick={clearError} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Library</h1>
          <p className="text-gray-600 mt-1">
            Create and manage tasks for your CrewAI workflows
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          <span>Create Task</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Form */}
      {(showForm || editingTask) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-h-[90vh] overflow-y-auto w-full max-w-7xl">
            <TaskForm
              task={editingTask || undefined}
              onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
              onCancel={handleCancelForm}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {viewingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{viewingTask.name}</CardTitle>
                  <CardDescription>
                    Task Details
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingTask(null)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{viewingTask.description}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Expected Output</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{viewingTask.expected_output}</p>
              </div>
              {viewingTask.tools && viewingTask.tools.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tools</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingTask.tools.map((tool, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {typeof tool === 'string' ? tool : 'Tool'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(viewingTask.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(viewingTask.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {loading && !tasks.length && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-gray-600">Loading tasks...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !tasks.length && !searchTerm && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-600 mb-4">
              Get started by creating your first task for your workflow.
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
              Create Your First Task
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No Search Results */}
      {!loading && !tasks.length && searchTerm && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-4">
              No tasks match your search criteria. Try adjusting your search terms.
            </p>
            <Button variant="outline" onClick={() => handleSearch('')}>
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Task Grid */}
      {tasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onView={handleViewTask}
            />
          ))}
        </div>
      )}

      {/* Loading More */}
      {loading && tasks.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
} 
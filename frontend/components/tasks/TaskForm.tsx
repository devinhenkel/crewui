'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Task, TaskCreate, TaskUpdate } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolSelector } from '@/components/ui/tool-selector';
import { X, Save, Plus } from 'lucide-react';

const taskSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().min(1, 'Description is required'),
  expected_output: z.string().min(1, 'Expected output is required'),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: TaskCreate | TaskUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function TaskForm({ task, onSubmit, onCancel, loading = false }: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTools, setSelectedTools] = useState<number[]>(task?.tools || []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: task?.name || '',
      description: task?.description || '',
      expected_output: task?.expected_output || '',
    },
  });

  const handleFormSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    try {
      const taskData = {
        ...data,
        tools: selectedTools,
      };
      await onSubmit(taskData);
      if (!task) {
        reset();
        setSelectedTools([]);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">
              {task ? 'Edit Task' : 'Create New Task'}
            </CardTitle>
            <CardDescription>
              {task ? 'Update task details' : 'Define a new task for your workflow'}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Task Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter task name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe what this task should accomplish"
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_output">Expected Output *</Label>
            <Textarea
              id="expected_output"
              {...register('expected_output')}
              placeholder="Describe the expected output or result of this task"
              rows={3}
              className={errors.expected_output ? 'border-red-500' : ''}
            />
            {errors.expected_output && (
              <p className="text-sm text-red-500">{errors.expected_output.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <ToolSelector
              selectedTools={selectedTools}
              onToolsChange={setSelectedTools}
              label="Tools"
              placeholder="Select tools for this task to use"
              maxTools={5}
              disabled={isSubmitting || loading}
            />
            <p className="text-xs text-gray-500">
              Choose the tools this task will have access to during execution.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loading}
              className="min-w-[100px]"
            >
              {isSubmitting || loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {task ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  <span>{task ? 'Update Task' : 'Create Task'}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Process, ProcessCreate, ProcessUpdate } from '@/types/process';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Save, Plus, GitBranch, ArrowRight } from 'lucide-react';

const processSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().optional(),
  process_type: z.enum(['sequential', 'hierarchical'], {
    required_error: 'Process type is required',
  }),
  configuration: z.record(z.any()).default({}),
});

type ProcessFormData = z.infer<typeof processSchema>;

interface ProcessFormProps {
  process?: Process;
  onSubmit: (data: ProcessCreate | ProcessUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ProcessForm({ process, onSubmit, onCancel, loading = false }: ProcessFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ProcessFormData>({
    resolver: zodResolver(processSchema),
    defaultValues: {
      name: process?.name || '',
      description: process?.description || '',
      process_type: process?.process_type || 'sequential',
      configuration: process?.configuration || {},
    },
  });

  const processType = watch('process_type');

  const handleFormSubmit = async (data: ProcessFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      if (!process) {
        reset();
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
              {process ? 'Edit Process' : 'Create New Process'}
            </CardTitle>
            <CardDescription>
              {process ? 'Update process configuration' : 'Define a new workflow process'}
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
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Process Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter process name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe what this process accomplishes"
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="process_type">Process Type *</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="radio"
                  id="sequential"
                  value="sequential"
                  {...register('process_type')}
                  className="sr-only"
                />
                <label
                  htmlFor="sequential"
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    processType === 'sequential'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <ArrowRight className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium text-gray-900">Sequential</div>
                      <div className="text-sm text-gray-500">
                        Tasks run in order, one after another
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              <div className="relative">
                <input
                  type="radio"
                  id="hierarchical"
                  value="hierarchical"
                  {...register('process_type')}
                  className="sr-only"
                />
                <label
                  htmlFor="hierarchical"
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    processType === 'hierarchical'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <GitBranch className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium text-gray-900">Hierarchical</div>
                      <div className="text-sm text-gray-500">
                        Tasks can run in parallel with dependencies
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
            {errors.process_type && (
              <p className="text-sm text-red-500">{errors.process_type.message}</p>
            )}
          </div>

          {/* Process Type Description */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              {processType === 'sequential' ? 'Sequential Process' : 'Hierarchical Process'}
            </h4>
            <p className="text-sm text-gray-600">
              {processType === 'sequential' 
                ? 'Tasks will be executed in a specific order. Each task waits for the previous one to complete before starting.'
                : 'Tasks can be organized in a hierarchy with parent-child relationships. Some tasks can run in parallel while others wait for dependencies.'
              }
            </p>
          </div>

          {/* Configuration Preview */}
          <div className="space-y-2">
            <Label>Configuration</Label>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                {processType === 'sequential' 
                  ? 'You will configure the task sequence and agent assignments in the process builder.'
                  : 'You will configure the task hierarchy and agent assignments in the process builder.'
                }
              </p>
            </div>
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
                  {process ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  <span>{process ? 'Update Process' : 'Create Process'}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Agent, AgentCreate, AgentUpdate } from '@/types/agent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAgentStore } from '@/lib/stores/agentStore';

const agentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  goal: z.string().min(1, 'Goal is required'),
  backstory: z.string().min(1, 'Backstory is required'),
});

type AgentFormData = z.infer<typeof agentSchema>;

interface AgentFormProps {
  agent?: Agent;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AgentForm({ agent, onSuccess, onCancel }: AgentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createAgent, updateAgent } = useAgentStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: agent ? {
      name: agent.name,
      role: agent.role,
      goal: agent.goal,
      backstory: agent.backstory,
    } : {
      name: '',
      role: '',
      goal: '',
      backstory: '',
    },
  });

  const onSubmit = async (data: AgentFormData) => {
    setIsSubmitting(true);
    try {
      if (agent) {
        await updateAgent(agent.id, data);
      } else {
        await createAgent(data);
      }
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to save agent:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{agent ? 'Edit Agent' : 'Create New Agent'}</CardTitle>
        <CardDescription>
          {agent ? 'Update the agent configuration' : 'Configure a new AI agent for your crew'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Research Analyst"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              {...register('role')}
              placeholder="e.g., Expert research analyst specializing in market trends"
              className={errors.role ? 'border-red-500' : ''}
            />
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Goal</Label>
            <Textarea
              id="goal"
              {...register('goal')}
              placeholder="e.g., Analyze market data and provide actionable insights"
              rows={3}
              className={errors.goal ? 'border-red-500' : ''}
            />
            {errors.goal && (
              <p className="text-sm text-red-500">{errors.goal.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="backstory">Backstory</Label>
            <Textarea
              id="backstory"
              {...register('backstory')}
              placeholder="e.g., You are an experienced market analyst with 10+ years of experience..."
              rows={4}
              className={errors.backstory ? 'border-red-500' : ''}
            />
            {errors.backstory && (
              <p className="text-sm text-red-500">{errors.backstory.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : agent ? 'Update Agent' : 'Create Agent'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 
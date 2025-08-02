'use client';

import { Agent } from '@/types/agent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye } from 'lucide-react';
import { useAgentStore } from '@/lib/stores/agentStore';

interface AgentCardProps {
  agent: Agent;
  onEdit?: (agent: Agent) => void;
  onView?: (agent: Agent) => void;
}

export function AgentCard({ agent, onEdit, onView }: AgentCardProps) {
  const { deleteAgent } = useAgentStore();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this agent?')) {
      await deleteAgent(agent.id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{agent.name}</CardTitle>
            <CardDescription className="mt-1">{agent.role}</CardDescription>
          </div>
          <div className="flex space-x-1">
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(agent)}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(agent)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Goal</h4>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {agent.goal}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Backstory</h4>
            <p className="text-sm text-gray-600 mt-1 line-clamp-3">
              {agent.backstory}
            </p>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Created: {new Date(agent.created_at).toLocaleDateString()}</span>
            <span>Updated: {new Date(agent.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
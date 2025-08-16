'use client';

import { useState, useEffect } from 'react';
import { Agent } from '@/types/agent';
import { Tool } from '@/types/tool';
import { toolsApi } from '@/lib/api/tools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, Wrench } from 'lucide-react';
import { useAgentStore } from '@/lib/stores/agentStore';

interface AgentCardProps {
  agent: Agent;
  onEdit?: (agent: Agent) => void;
  onView?: (agent: Agent) => void;
}

export function AgentCard({ agent, onEdit, onView }: AgentCardProps) {
  const { deleteAgent } = useAgentStore();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);

  useEffect(() => {
    if (agent.tools && agent.tools.length > 0) {
      loadTools();
    }
  }, [agent.tools]);

  const loadTools = async () => {
    setLoadingTools(true);
    try {
      // Load all tools and filter by the agent's tool IDs
      const allTools = await toolsApi.getTools();
      const agentTools = allTools.filter(tool => agent.tools.includes(tool.id));
      setTools(agentTools);
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setLoadingTools(false);
    }
  };

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

          {/* Tools Display */}
          {agent.tools && agent.tools.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Wrench className="h-3 w-3 mr-1" />
                Tools ({agent.tools.length})
              </h4>
              {loadingTools ? (
                <div className="flex items-center space-x-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-900"></div>
                  <span className="text-xs text-gray-500">Loading tools...</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {tools.slice(0, 3).map((tool) => (
                    <Badge 
                      key={tool.id} 
                      variant="outline" 
                      className="text-xs px-2 py-0.5"
                    >
                      {tool.name}
                    </Badge>
                  ))}
                  {tools.length > 3 && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-gray-100">
                      +{tools.length - 3} more
                    </Badge>
                  )}
                  {tools.length === 0 && !loadingTools && (
                    <span className="text-xs text-gray-400">No tools found</span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between text-xs text-gray-500">
            <span>Created: {new Date(agent.created_at).toLocaleDateString()}</span>
            <span>Updated: {new Date(agent.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
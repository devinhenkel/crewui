'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Tool } from '@/types/tool';
import { toolsApi } from '@/lib/api/tools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, Wrench } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onView: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onDelete, onView }: TaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);

  useEffect(() => {
    if (task.tools && task.tools.length > 0) {
      loadTools();
    }
  }, [task.tools]);

  const loadTools = async () => {
    setLoadingTools(true);
    try {
      // Load all tools and filter by the task's tool IDs
      const allTools = await toolsApi.getTools();
      const taskTools = allTools.filter(tool => task.tools.includes(tool.id));
      setTools(taskTools);
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setLoadingTools(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${task.name}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(task.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {task.name}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Created {formatDate(task.created_at)}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(task)}
              className="h-8 w-8 p-0"
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              className="h-8 w-8 p-0"
              title="Edit task"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              title="Delete task"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
            <p className="text-sm text-gray-600 line-clamp-3">
              {task.description}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Expected Output</h4>
            <p className="text-sm text-gray-600 line-clamp-2">
              {task.expected_output}
            </p>
          </div>

          {task.tools && task.tools.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Wrench className="h-3 w-3 mr-1" />
                Tools ({task.tools.length})
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
        </div>

        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Last updated: {formatDate(task.updated_at)}</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
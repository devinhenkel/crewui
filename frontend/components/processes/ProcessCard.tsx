'use client';

import { useState } from 'react';
import { Process } from '@/types/process';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Play, GitBranch, ArrowRight, Settings } from 'lucide-react';
import { VariableInputDialog } from './VariableInputDialog';

interface ProcessCardProps {
  process: Process;
  onEdit: (process: Process) => void;
  onDelete: (id: number) => void;
  onView: (process: Process) => void;
  onExecute: (id: number, variables?: Record<string, string>) => Promise<{ execution_id: number }>;
  onConfigure: (process: Process) => void;
}

export function ProcessCard({ process, onEdit, onDelete, onView, onExecute, onConfigure }: ProcessCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showVariableDialog, setShowVariableDialog] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${process.name}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(process.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleExecuteClick = () => {
    setShowVariableDialog(true);
  };

  const handleExecute = async (variables: Record<string, string>) => {
    setIsExecuting(true);
    try {
      const result = await onExecute(process.id, variables);
      console.log('Execution started:', result);
      // You could navigate to the execution details here
    } catch (error) {
      console.error('Execution failed:', error);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getProcessTypeIcon = () => {
    return process.process_type === 'sequential' ? (
      <ArrowRight className="h-4 w-4 text-purple-600" />
    ) : (
      <GitBranch className="h-4 w-4 text-purple-600" />
    );
  };

  const getProcessTypeLabel = () => {
    return process.process_type === 'sequential' ? 'Sequential' : 'Hierarchical';
  };

  const getProcessTypeColor = () => {
    return process.process_type === 'sequential' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-purple-100 text-purple-800';
  };

  return (
    <>
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                {getProcessTypeIcon()}
                <CardTitle className="text-lg font-semibold truncate">
                  {process.name}
                </CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                Created {formatDate(process.created_at)}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(process)}
                className="h-8 w-8 p-0"
                title="View details"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onConfigure(process)}
                className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                title="Configure process"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(process)}
                className="h-8 w-8 p-0"
                title="Edit process"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExecuteClick}
                disabled={isExecuting}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                title="Execute process"
              >
                {isExecuting ? (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                title="Delete process"
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
            {process.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {process.description}
                </p>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Process Type</h4>
              <span className={`inline-block px-2 py-1 text-xs rounded-full ${getProcessTypeColor()}`}>
                {getProcessTypeLabel()}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Configuration</h4>
              <div className="text-sm text-gray-600">
                {process.process_type === 'sequential' ? (
                  <span>Sequential workflow with {process.configuration.steps?.length || 0} steps</span>
                ) : (
                  <span>Hierarchical workflow with {process.configuration.tasks?.length || 0} tasks</span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Last updated: {formatDate(process.updated_at)}</span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                Ready
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <VariableInputDialog
        process={process}
        isOpen={showVariableDialog}
        onClose={() => setShowVariableDialog(false)}
        onExecute={handleExecute}
        loading={isExecuting}
      />
    </>
  );
} 
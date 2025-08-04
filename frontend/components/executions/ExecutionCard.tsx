'use client';

import { useState } from 'react';
import { Execution } from '@/types/execution';
import { useExecutionStore } from '@/lib/stores/executionStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  Trash2, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ExecutionCardProps {
  execution: Execution;
  onViewDetails?: (execution: Execution) => void;
}

export function ExecutionCard({ execution, onViewDetails }: ExecutionCardProps) {
  const { stopExecution, deleteExecution, loading } = useExecutionStore();
  const [showLog, setShowLog] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'stopped':
        return <Square className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'stopped':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStop = async () => {
    if (execution.status === 'running') {
      await stopExecution(execution.id);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this execution?')) {
      await deleteExecution(execution.id);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(execution.status)}
            <CardTitle className="text-lg">
              {execution.process?.name || `Process ${execution.process_id}`}
            </CardTitle>
          </div>
          <Badge className={getStatusColor(execution.status)}>
            {execution.status}
          </Badge>
        </div>
        <CardDescription>
          Started {formatDistanceToNow(new Date(execution.started_at), { addSuffix: true })}
          {execution.completed_at && (
            <span className="ml-2">
              • Completed {formatDistanceToNow(new Date(execution.completed_at), { addSuffix: true })}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {execution.process && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Type:</span> {execution.process.process_type}
            {execution.process.description && (
              <span className="ml-4">
                <span className="font-medium">Description:</span> {execution.process.description}
              </span>
            )}
          </div>
        )}

        {execution.console_log && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Console Log</h4>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(execution.console_log || '')}
                  disabled={!execution.console_log}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLog(!showLog)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {showLog && (
              <div className="bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {execution.console_log}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex space-x-2">
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(execution)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Details
              </Button>
            )}
            
            {execution.status === 'running' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                disabled={loading}
              >
                <Square className="h-3 w-3 mr-1" />
                Stop
              </Button>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 
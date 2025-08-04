'use client';

import { useState, useEffect, useRef } from 'react';
import { Execution } from '@/types/execution';
import { useExecutionStore } from '@/lib/stores/executionStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock,
  Copy,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ExecutionMonitorProps {
  executionId: number;
  onClose?: () => void;
}

export function ExecutionMonitor({ executionId, onClose }: ExecutionMonitorProps) {
  const { currentExecution, fetchExecution, stopExecution, loading } = useExecutionStore();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchExecution(executionId);

    // Set up polling for running executions
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        if (currentExecution && currentExecution.status === 'running') {
          fetchExecution(executionId);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [executionId, autoRefresh, currentExecution?.status, fetchExecution]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="h-4 w-4 text-blue-500 animate-pulse" />;
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
    if (currentExecution?.status === 'running') {
      await stopExecution(executionId);
    }
  };

  const handleRefresh = () => {
    fetchExecution(executionId);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!currentExecution) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading execution...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(currentExecution.status)}
            <CardTitle className="text-lg">
              {currentExecution.process?.name || `Process ${currentExecution.process_id}`}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(currentExecution.status)}>
              {currentExecution.status}
            </Badge>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Started {formatDistanceToNow(new Date(currentExecution.started_at), { addSuffix: true })}
          {currentExecution.completed_at && (
            <span className="ml-2">
              • Completed {formatDistanceToNow(new Date(currentExecution.completed_at), { addSuffix: true })}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {currentExecution.process && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Type:</span> {currentExecution.process.process_type}
            {currentExecution.process.description && (
              <span className="ml-4">
                <span className="font-medium">Description:</span> {currentExecution.process.description}
              </span>
            )}
          </div>
        )}

        {currentExecution.console_log && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Console Log</h4>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(currentExecution.console_log || '')}
                  disabled={!currentExecution.console_log}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-md p-3 max-h-96 overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {currentExecution.console_log}
              </pre>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="auto-refresh" className="text-sm text-gray-600">
              Auto-refresh
            </label>
          </div>
          
          {currentExecution.status === 'running' && (
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
      </CardContent>
    </Card>
  );
} 
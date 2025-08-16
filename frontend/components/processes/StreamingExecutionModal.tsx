'use client';

import { useState, useEffect, useRef } from 'react';
import { Process } from '@/types/process';
import { useExecutionStream, ExecutionLog } from '@/lib/hooks/useExecutionStream';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock,
  Copy,
  Download,
  Maximize2,
  Minimize2,
  Loader2,
  Activity,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StreamingExecutionModalProps {
  process: Process | null;
  isOpen: boolean;
  onClose: () => void;
  variables?: Record<string, string>;
  autoStart?: boolean;
}

export function StreamingExecutionModal({ 
  process, 
  isOpen, 
  onClose, 
  variables = {},
  autoStart = false
}: StreamingExecutionModalProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showOnlyImportant, setShowOnlyImportant] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  const {
    logs,
    status,
    executionId,
    processName,
    startTime,
    endTime,
    error,
    progress,
    startExecution,
    stopExecution,
    clearLogs,
    isConnected,
    connectionError,
  } = useExecutionStream({
    onComplete: (id) => {
      console.log('Execution completed:', id);
    },
    onError: (err, id) => {
      console.error('Execution error:', err, id);
    },
  });

  // Auto-start execution when modal opens if autoStart is true
  useEffect(() => {
    if (isOpen && autoStart && process && status === 'idle') {
      startExecution(process.id, variables);
    }
  }, [isOpen, autoStart, process, status, variables, startExecution]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (shouldAutoScroll.current && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [logs]);

  const handleScroll = (event: any) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    shouldAutoScroll.current = isAtBottom;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connecting':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connecting':
        return 'bg-blue-100 text-blue-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLogIcon = (type: ExecutionLog['type']) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'progress':
        return '🔄';
      default:
        return '📋';
    }
  };

  const getLogTextColor = (type: ExecutionLog['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'success':
        return 'text-green-600';
      case 'progress':
        return 'text-blue-600';
      default:
        return 'text-gray-700';
    }
  };

  const formatDuration = () => {
    if (!startTime) return null;
    const end = endTime || Date.now();
    const duration = end - startTime;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const copyLogsToClipboard = () => {
    const logsText = logs.map(log => 
      `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.content}`
    ).join('\n');
    navigator.clipboard.writeText(logsText);
  };

  const downloadLogs = () => {
    const logsText = logs.map(log => 
      `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.content}`
    ).join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-${executionId || 'unknown'}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = showOnlyImportant 
    ? logs.filter(log => log.isImportant)
    : logs;

  const progressPercent = progress 
    ? Math.round((progress.currentStep / progress.totalSteps) * 100)
    : 0;

  const canStart = process && status === 'idle';
  const canStop = status === 'running' || status === 'connecting';

  if (!process) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMaximized ? 'max-w-[95vw] h-[95vh]' : 'max-w-4xl h-[80vh]'} flex flex-col p-0`}>
        <DialogHeader className="flex-shrink-0 p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              {getStatusIcon()}
              <span>Execute: {process.name}</span>
              {executionId && (
                <Badge variant="outline" className="ml-2">
                  #{executionId}
                </Badge>
              )}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMaximized(!isMaximized)}
              >
                {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Status Bar */}
        <div className="flex-shrink-0 px-6 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge className={getStatusColor()}>
                {status}
              </Badge>
              {isConnected && (
                <Badge variant="outline" className="text-green-600">
                  <Zap className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
              {connectionError && (
                <Badge variant="outline" className="text-red-600">
                  Connection Error
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {startTime && (
                <span>
                  Duration: {formatDuration()}
                </span>
              )}
              {logs.length > 0 && (
                <span>
                  Logs: {logs.length}
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{progress.stepDescription}</span>
                <span className="text-gray-500">
                  Step {progress.currentStep} of {progress.totalSteps}
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {canStart && (
                <Button
                  onClick={() => startExecution(process.id, variables)}
                  disabled={!process}
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Start Execution
                </Button>
              )}
              {canStop && (
                <Button
                  onClick={stopExecution}
                  variant="destructive"
                  size="sm"
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              )}
              <Button
                onClick={clearLogs}
                variant="outline"
                size="sm"
                disabled={logs.length === 0}
              >
                Clear Logs
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowOnlyImportant(!showOnlyImportant)}
                variant="outline"
                size="sm"
                className={showOnlyImportant ? 'bg-blue-50' : ''}
              >
                {showOnlyImportant ? 'Show All' : 'Important Only'}
              </Button>
              <Button
                onClick={copyLogsToClipboard}
                variant="outline"
                size="sm"
                disabled={logs.length === 0}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                onClick={downloadLogs}
                variant="outline"
                size="sm"
                disabled={logs.length === 0}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Logs Display - Main scrollable area */}
        <div className="flex-1 flex flex-col min-h-0 px-6">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="py-2 px-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Execution Output</h4>
                {filteredLogs.length !== logs.length && (
                  <span className="text-xs text-gray-500">
                    Showing {filteredLogs.length} of {logs.length} logs
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 min-h-0">
              <ScrollArea 
                ref={scrollAreaRef}
                className="h-full w-full"
                onScrollCapture={handleScroll}
              >
                <div className="p-4">
                  {filteredLogs.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-gray-500">
                      {status === 'idle' ? 'Ready to start execution...' : 'No logs yet...'}
                    </div>
                  ) : (
                    <div className="space-y-1 font-mono text-xs">
                      {filteredLogs.map((log) => (
                        <div
                          key={log.id}
                          className={`flex items-start space-x-2 ${
                            log.isImportant ? 'bg-yellow-50 border-l-2 border-yellow-400 pl-2' : ''
                          }`}
                        >
                          <span className="text-gray-400 w-20 flex-shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="flex-shrink-0">
                            {getLogIcon(log.type)}
                          </span>
                          <span className={`flex-1 break-words ${getLogTextColor(log.type)}`}>
                            {log.content}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex-shrink-0 p-6 pt-4">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2 text-red-700">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">Execution Error:</span>
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
import { useState, useCallback, useRef } from 'react';
import { useWebSocket, WebSocketMessage } from './useWebSocket';
import { getApiUrl } from '@/lib/config';

export interface ExecutionLog {
  id: string;
  timestamp: number;
  type: 'info' | 'error' | 'warning' | 'success' | 'progress';
  content: string;
  isImportant?: boolean;
}

export interface ExecutionStreamState {
  logs: ExecutionLog[];
  status: 'idle' | 'connecting' | 'running' | 'completed' | 'failed' | 'cancelled';
  executionId: number | null;
  processName: string | null;
  startTime: number | null;
  endTime: number | null;
  variables: Record<string, string> | null;
  error: string | null;
  progress: {
    currentStep: number;
    totalSteps: number;
    stepDescription: string;
  } | null;
}

interface UseExecutionStreamOptions {
  onComplete?: (executionId: number) => void;
  onError?: (error: string, executionId: number) => void;
  maxLogs?: number;
}

interface UseExecutionStreamReturn extends ExecutionStreamState {
  startExecution: (processId: number, variables?: Record<string, string>) => Promise<void>;
  stopExecution: () => void;
  clearLogs: () => void;
  isConnected: boolean;
  connectionError: string | null;
}

export function useExecutionStream(options: UseExecutionStreamOptions = {}): UseExecutionStreamReturn {
  const { onComplete, onError, maxLogs = 1000 } = options;
  
  const [state, setState] = useState<ExecutionStreamState>({
    logs: [],
    status: 'idle',
    executionId: null,
    processName: null,
    startTime: null,
    endTime: null,
    variables: null,
    error: null,
    progress: null,
  });

  const logIdCounter = useRef(0);

  const addLog = useCallback((content: string, type: ExecutionLog['type'] = 'info', isImportant = false) => {
    const log: ExecutionLog = {
      id: `log_${logIdCounter.current++}`,
      timestamp: Date.now(),
      type,
      content,
      isImportant,
    };

    setState(prev => ({
      ...prev,
      logs: [...prev.logs.slice(-(maxLogs - 1)), log],
    }));
  }, [maxLogs]);

  const parseProgressFromContent = useCallback((content: string) => {
    // Parse step progress like "Step 1/3: Processing agent and task..."
    const stepMatch = content.match(/Step (\d+)\/(\d+):\s*(.+)/);
    if (stepMatch) {
      return {
        currentStep: parseInt(stepMatch[1]),
        totalSteps: parseInt(stepMatch[2]),
        stepDescription: stepMatch[3],
      };
    }
    return null;
  }, []);

  const getLogTypeFromContent = useCallback((content: string): ExecutionLog['type'] => {
    if (content.includes('❌') || content.includes('Error') || content.includes('Failed')) {
      return 'error';
    }
    if (content.includes('⚠️') || content.includes('Warning')) {
      return 'warning';
    }
    if (content.includes('✅') || content.includes('completed') || content.includes('successfully')) {
      return 'success';
    }
    if (content.includes('🔄') || content.includes('Processing') || content.includes('Step')) {
      return 'progress';
    }
    return 'info';
  }, []);

  const isImportantLog = useCallback((content: string): boolean => {
    return (
      content.includes('✅ Crew execution completed') ||
      content.includes('❌ Error') ||
      content.includes('🚀 Starting crew execution') ||
      content.includes('⏱️') ||
      content.includes('📊')
    );
  }, []);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    console.log('Execution stream message:', message);

    switch (message.type) {
      case 'connection_established':
        addLog(`🔌 Connected to execution stream`, 'success');
        setState(prev => ({ ...prev, status: 'connecting' }));
        break;

      case 'execution_started':
        setState(prev => ({
          ...prev,
          status: 'running',
          executionId: message.execution_id || null,
          processName: message.process_name || null,
          startTime: Date.now(),
          variables: message.variables || null,
        }));
        addLog(`🚀 Execution started for: ${message.process_name}`, 'success', true);
        if (message.variables && Object.keys(message.variables).length > 0) {
          addLog(`📋 Variables: ${Object.keys(message.variables).length} provided`, 'info');
        }
        break;

      case 'output':
        if (message.content) {
          const logType = getLogTypeFromContent(message.content);
          const isImportant = isImportantLog(message.content);
          const progress = parseProgressFromContent(message.content);
          
          if (progress) {
            setState(prev => ({ ...prev, progress }));
          }
          
          addLog(message.content.trim(), logType, isImportant);
        }
        break;

      case 'execution_completed':
        setState(prev => ({
          ...prev,
          status: 'completed',
          endTime: Date.now(),
        }));
        addLog(`🎉 Execution completed successfully!`, 'success', true);
        if (state.executionId) {
          onComplete?.(state.executionId);
        }
        break;

      case 'execution_error':
        setState(prev => ({
          ...prev,
          status: 'failed',
          endTime: Date.now(),
          error: message.error || 'Unknown error',
        }));
        addLog(`❌ Execution failed: ${message.error}`, 'error', true);
        if (message.traceback) {
          addLog(`🔍 Traceback: ${message.traceback}`, 'error');
        }
        if (state.executionId) {
          onError?.(message.error || 'Unknown error', state.executionId);
        }
        break;

      case 'execution_stopped':
        setState(prev => ({
          ...prev,
          status: 'cancelled',
          endTime: Date.now(),
        }));
        addLog(`🛑 Execution stopped`, 'warning', true);
        break;

      default:
        console.warn('Unknown message type:', message.type);
        addLog(`📩 Unknown message: ${message.type}`, 'warning');
    }
  }, [addLog, getLogTypeFromContent, isImportantLog, parseProgressFromContent, state.executionId, onComplete, onError]);

  const { connect, disconnect, sendMessage, isConnected, error: connectionError } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      console.log('WebSocket connection established');
    },
    onClose: () => {
      console.log('WebSocket connection closed');
      if (state.status === 'running') {
        addLog(`🔌 Connection lost during execution`, 'warning', true);
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      addLog(`❌ Connection error`, 'error', true);
    },
    maxReconnectAttempts: 3,
    reconnectInterval: 2000,
  });

  const startExecution = useCallback(async (processId: number, variables: Record<string, string> = {}) => {
    try {
      setState(prev => ({
        ...prev,
        status: 'connecting',
        logs: [],
        error: null,
        startTime: null,
        endTime: null,
        progress: null,
      }));

      addLog(`🚀 Starting execution for process ${processId}...`, 'info', true);

      // Start execution via REST API
      const response = await fetch(`${getApiUrl()}/processes/${processId}/execute/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variables }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start execution: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Execution started:', result);

      // Connect to WebSocket
      const wsUrl = `${getApiUrl().replace(/^http/, 'ws')}/processes/ws/execution/${result.execution_id}`;
      addLog(`🔌 Connecting to execution stream...`, 'info');
      connect(wsUrl);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: errorMessage,
      }));
      addLog(`❌ Failed to start execution: ${errorMessage}`, 'error', true);
      throw error;
    }
  }, [connect, addLog]);

  const stopExecution = useCallback(() => {
    if (state.executionId && isConnected) {
      sendMessage({
        type: 'stop_execution',
        execution_id: state.executionId,
      });
      addLog(`🛑 Stop signal sent`, 'warning', true);
    }
    disconnect();
  }, [state.executionId, isConnected, sendMessage, disconnect, addLog]);

  const clearLogs = useCallback(() => {
    setState(prev => ({
      ...prev,
      logs: [],
    }));
  }, []);

  return {
    ...state,
    startExecution,
    stopExecution,
    clearLogs,
    isConnected,
    connectionError,
  };
}
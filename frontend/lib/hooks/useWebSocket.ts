import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  execution_id?: number;
  content?: string;
  error?: string;
  traceback?: string;
  message?: string;
  timestamp?: number;
  process_name?: string;
  variables?: Record<string, string>;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  connect: (url: string) => void;
  disconnect: () => void;
  sendMessage: (message: any) => void;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    autoConnect = false,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const urlRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback((url: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    setIsConnecting(true);
    setError(null);
    urlRef.current = url;
    shouldReconnectRef.current = true;

    try {
      // Convert HTTP URL to WebSocket URL
      const wsUrl = url.replace(/^http/, 'ws');
      console.log('Connecting to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        setReconnectAttempts(0);
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          onMessage?.(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', event.data);
          setError('Failed to parse message');
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;
        onClose?.();

        // Attempt to reconnect if it wasn't a manual disconnect
        if (shouldReconnectRef.current && reconnectAttempts < maxReconnectAttempts) {
          setReconnectAttempts(prev => prev + 1);
          console.log(`Attempting to reconnect in ${reconnectInterval}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (urlRef.current && shouldReconnectRef.current) {
              connect(urlRef.current);
            }
          }, reconnectInterval);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached');
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setIsConnecting(false);
        onError?.(event);
      };

    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
    }
  }, [onMessage, onOpen, onClose, onError, reconnectInterval, maxReconnectAttempts, reconnectAttempts]);

  const disconnect = useCallback(() => {
    console.log('Manually disconnecting WebSocket');
    shouldReconnectRef.current = false;
    clearReconnectTimeout();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setReconnectAttempts(0);
  }, [clearReconnectTimeout]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
        wsRef.current.send(messageStr);
        console.log('WebSocket message sent:', message);
      } catch (err) {
        console.error('Failed to send WebSocket message:', err);
        setError('Failed to send message');
      }
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', message);
      setError('WebSocket not connected');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimeout();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [clearReconnectTimeout]);

  return {
    connect,
    disconnect,
    sendMessage,
    isConnected,
    isConnecting,
    error,
    reconnectAttempts,
  };
}
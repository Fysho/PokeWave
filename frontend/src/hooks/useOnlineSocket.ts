import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useOnlineStore } from '../store/onlineStore';
import { useAuthStore } from '../store/authStore';
import type {
  OnlineRoundState,
  TickData,
  NewRoundData,
  RoundResultsData,
  OnlinePlayer
} from '../types/online';

const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

interface UseOnlineSocketOptions {
  autoConnect?: boolean;
}

export function useOnlineSocket(options: UseOnlineSocketOptions = {}) {
  const { autoConnect = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { token, isAuthenticated } = useAuthStore();
  const {
    setConnected,
    setAuthenticated,
    setRoundState,
    updateTick,
    handleNewRound,
    handleRoundResults,
    setOnlinePlayers,
    setError
  } = useOnlineStore();

  // Initialize socket connection
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    // Clean up existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(WEBSOCKET_URL, {
      path: '/ws/online',
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    // Connection events
    socket.on('connect', () => {
      console.log('[Online] WebSocket connected');
      setConnected(true);
      setError(null);

      // Authenticate if we have a token
      if (token) {
        socket.emit('authenticate', { token });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[Online] WebSocket disconnected:', reason);
      setConnected(false);
      setAuthenticated(false);
      stopHeartbeat();

      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'transport close') {
        scheduleReconnect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('[Online] WebSocket connection error:', error);
      setError('Failed to connect to online server');
      scheduleReconnect();
    });

    // Authentication response
    socket.on('authenticated', (data: { success: boolean; userId?: string; error?: string }) => {
      if (data.success) {
        console.log('[Online] Authentication successful');
        setAuthenticated(true);
        startHeartbeat();
      } else {
        console.error('[Online] Authentication failed:', data.error);
        setAuthenticated(false);
        setError(data.error || 'Authentication failed');
      }
    });

    // Round state update (initial state when connecting)
    socket.on('round-state', (state: OnlineRoundState) => {
      console.log('[Online] Received round state:', state.roundNumber);
      setRoundState(state);
    });

    // Tick updates (every second)
    socket.on('tick', (tick: TickData) => {
      updateTick(tick);
    });

    // New round started
    socket.on('new-round', (data: NewRoundData) => {
      console.log('[Online] New round started:', data.roundNumber);
      handleNewRound(data);
    });

    // Round results
    socket.on('round-results', (data: RoundResultsData) => {
      console.log('[Online] Round results:', data.roundNumber, 'Win %:', data.actualWinPercent);
      handleRoundResults(data);
    });

    // Players update
    socket.on('players-update', (players: OnlinePlayer[]) => {
      setOnlinePlayers(players);
    });

    socketRef.current = socket;
    socket.connect();
  }, [
    token,
    setConnected,
    setAuthenticated,
    setRoundState,
    updateTick,
    handleNewRound,
    handleRoundResults,
    setOnlinePlayers,
    setError
  ]);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    stopHeartbeat();
    cancelReconnect();

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setConnected(false);
    setAuthenticated(false);
  }, [setConnected, setAuthenticated]);

  // Schedule reconnection attempt
  const scheduleReconnect = useCallback(() => {
    cancelReconnect();
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('[Online] Attempting to reconnect...');
      connect();
    }, 3000);
  }, [connect]);

  // Cancel scheduled reconnection
  const cancelReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Start heartbeat interval
  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('heartbeat');
      }
    }, 30000); // Every 30 seconds
  }, []);

  // Stop heartbeat interval
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Notify server that we submitted a guess
  const notifyGuessSubmitted = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('guess-submitted');
    }
  }, []);

  // Re-authenticate if token changes while connected
  useEffect(() => {
    if (socketRef.current?.connected && token) {
      socketRef.current.emit('authenticate', { token });
    }
  }, [token]);

  // Auto-connect on mount if authenticated and autoConnect is true
  useEffect(() => {
    if (autoConnect && isAuthenticated && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, isAuthenticated, token, connect, disconnect]);

  return {
    socket: socketRef.current,
    connect,
    disconnect,
    notifyGuessSubmitted,
    isConnected: socketRef.current?.connected ?? false
  };
}

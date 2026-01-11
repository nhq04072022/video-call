/**
 * Hook for polling session status
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { sessionApi } from '../services/api';
import type { SessionStatusResponse, Participant } from '../types/session';

interface UseSessionStatusOptions {
  sessionId: string;
  enabled?: boolean;
  interval?: number; // Polling interval in milliseconds
  onStatusUpdate?: (status: SessionStatusResponse) => void;
}

interface UseSessionStatusReturn {
  status: SessionStatusResponse | null;
  participants: Participant[];
  readyCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useSessionStatus = (
  options: UseSessionStatusOptions
): UseSessionStatusReturn => {
  const { sessionId, enabled = true, interval = 2000, onStatusUpdate } = options;
  
  const [status, setStatus] = useState<SessionStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const intervalRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const fetchStatus = useCallback(async () => {
    if (!sessionId || !enabled) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await sessionApi.getSessionStatus(sessionId);
      setStatus(response);
      onStatusUpdate?.(response);
      
      // Reset retry count on success
      retryCountRef.current = 0;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch session status');
      setError(error);
      
      // Exponential backoff on errors
      retryCountRef.current += 1;
      if (retryCountRef.current >= maxRetries) {
        console.error('Max retries reached for session status polling');
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, enabled, onStatusUpdate]);

  // Polling effect
  useEffect(() => {
    if (!sessionId || !enabled) return;

    // Initial fetch
    fetchStatus();

    // Set up polling interval
    intervalRef.current = window.setInterval(() => {
      fetchStatus();
    }, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sessionId, enabled, interval, fetchStatus]);

  // Stop polling when all participants are ready (2/2)
  useEffect(() => {
    if (status?.participants) {
      const readyCount = status.participants.filter(
        (p) => p.role && (p.role === 'mentor' || p.role === 'patient')
      ).length;
      
      if (readyCount >= 2 && intervalRef.current) {
        // Stop polling when 2/2 ready
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [status]);

  const participants = status?.participants || [];
  const readyCount = participants.length;

  return {
    status,
    participants,
    readyCount,
    isLoading,
    error,
    refetch: fetchStatus,
  };
};


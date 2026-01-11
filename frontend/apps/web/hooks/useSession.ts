import { useState, useEffect } from 'react';
import apiClient from '@/shared/utils/api';

interface SessionJoinToken {
  token: string;
  url: string;
  roomName: string;
}

export const useSession = () => {
  const [joinToken, setJoinToken] = useState<SessionJoinToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJoinToken = async (): Promise<SessionJoinToken | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<SessionJoinToken>('/api/sessions/join-token');
      setJoinToken(response.data);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to get join token';
      setError(errorMsg);
      console.error('Error fetching join token:', err.response?.data || err);
      
      // Show user-friendly error message
      if (err.response?.status === 500 && errorMsg.includes('LiveKit not configured')) {
        alert('LiveKit server is not configured yet. The meeting feature requires LiveKit setup.\n\nPlease configure LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in the backend .env file.');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    try {
      await apiClient.post('/api/sessions/start');
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to start session');
    }
  };

  const endSession = async () => {
    try {
      await apiClient.post('/api/sessions/end');
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to end session');
    }
  };

  return {
    joinToken,
    loading,
    error,
    fetchJoinToken,
    startSession,
    endSession,
  };
};


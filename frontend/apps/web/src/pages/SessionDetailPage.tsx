import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { sessionApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';

interface SessionDetail {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: string;
  scheduled_time: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  mentee_goal: string;
  mentee_questions: string;
  livekit_room_name: string;
  created_at: string;
  updated_at: string;
}

export const SessionDetailPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setCurrentSessionId = useSessionStore((state) => state.setCurrentSessionId);
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadSessionDetail();
    }
  }, [sessionId]);

  const loadSessionDetail = async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await sessionApi.getSessionDetail(sessionId);
      setSession(response);
    } catch (err: any) {
      console.error('Failed to load session detail:', err);
      setError(err.message || 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = () => {
    if (!sessionId) return;
    setCurrentSessionId(sessionId);
    // Navigate to waiting room first
    navigate(`/sessions/${sessionId}/waiting`);
  };

  const handleStartSession = async () => {
    if (!sessionId) return;
    
    // Check if user is mentor (support both lowercase and uppercase)
    const userRole = user?.role?.toLowerCase();
    if (!user || (userRole !== 'mentor' && userRole !== 'MENTOR')) {
      setError('Only mentors can start sessions');
      return;
    }

    try {
      // Don't call startSession here - it will be called from waiting room
      setCurrentSessionId(sessionId);
      // Navigate to waiting room first
      navigate(`/sessions/${sessionId}/waiting`);
    } catch (err: any) {
      console.error('Failed to start session:', err);
      setError(err.message || 'Failed to start session');
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    
    const endedBy = user?.id || 'current_user';
    try {
      await sessionApi.endSession(sessionId, endedBy, 'normal_completion');
      await loadSessionDetail();
    } catch (err: any) {
      console.error('Failed to end session:', err);
      setError(err.message || 'Failed to end session');
    }
  };

  if (isLoading) {
    return (
      <div className="wave-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple mx-auto mb-4" />
          <p className="text-text-grey">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="wave-background min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md bg-white rounded-card-lg shadow-lg p-8">
          <p className="text-red-600 mb-4 font-semibold">{error}</p>
          <Button variant="primary" onClick={() => navigate('/sessions')}>
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACCEPTED':
      case 'PENDING':
        return 'bg-blue-100 text-blue-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'ENDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="wave-background min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-heading text-text-grey">
            Session Details
          </h1>
          <Button variant="secondary" size="lg" onClick={() => navigate('/sessions')}>
            Back to Sessions
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-card" role="alert" aria-live="assertive">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-card-lg shadow-2xl p-8 mb-6 animate-fade-in">
          <h2 className="text-2xl font-heading text-text-grey mb-6">Session Information</h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-500 min-w-[150px]">Status:</span>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(session.status)}`}>
                {session.status.toUpperCase()}
              </span>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500 block mb-2">Scheduled Time:</span>
              <p className="text-text-grey">
                {new Date(session.scheduled_time).toLocaleString()}
              </p>
            </div>

            {session.start_time && (
              <div>
                <span className="text-sm font-medium text-gray-500 block mb-2">Start Time:</span>
                <p className="text-text-grey">
                  {new Date(session.start_time).toLocaleString()}
                </p>
              </div>
            )}

            {session.end_time && (
              <div>
                <span className="text-sm font-medium text-gray-500 block mb-2">End Time:</span>
                <p className="text-text-grey">
                  {new Date(session.end_time).toLocaleString()}
                </p>
              </div>
            )}

            {session.duration_minutes && (
              <div>
                <span className="text-sm font-medium text-gray-500 block mb-2">Duration:</span>
                <p className="text-text-grey">
                  {session.duration_minutes} minutes
                </p>
              </div>
            )}

            {session.mentee_goal && (
              <div>
                <span className="text-sm font-medium text-gray-500 block mb-2">Mục tiêu Phiên:</span>
                <p className="text-text-grey whitespace-pre-wrap">{session.mentee_goal}</p>
              </div>
            )}

            {session.mentee_questions && (
              <div>
                <span className="text-sm font-medium text-gray-500 block mb-2">Câu hỏi Cụ thể:</span>
                <p className="text-text-grey whitespace-pre-wrap">{session.mentee_questions}</p>
              </div>
            )}

            {session.livekit_room_name && (
              <div>
                <span className="text-sm font-medium text-gray-500 block mb-2">Room Name:</span>
                <p className="text-text-grey font-mono">{session.livekit_room_name}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {(session.status === 'ACCEPTED' || session.status === 'ACTIVE') && (
            <Button variant="primary" size="lg" onClick={handleJoinSession}>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Join Session
              </span>
            </Button>
          )}
          {session.status === 'ACCEPTED' && user && (user.role?.toLowerCase() === 'mentor' || user.role === 'MENTOR') && (
            <Button variant="primary" size="lg" onClick={handleStartSession}>
              Start Session
            </Button>
          )}
          {session.status === 'ACTIVE' && (
            <Button variant="danger" size="lg" onClick={handleEndSession}>
              End Session
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};






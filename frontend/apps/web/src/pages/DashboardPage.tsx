/**
 * Dashboard Page - Display sessions and allow starting/joining
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useSessionStore } from '../stores/sessionStore';
import { sessionApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import type { SessionListItem } from '../types/session';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const setCurrentSessionId = useSessionStore((state) => state.setCurrentSessionId);
  const user = useAuthStore((state) => state.user);

  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await sessionApi.listSessions();
      setSessions(response.sessions);
    } catch (err: any) {
      console.error('Failed to load sessions:', err);
      setError(err.message || 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async (sessionId: string) => {
    if (!user || user.role !== 'mentor') {
      return;
    }
    try {
      // Navigate to waiting room first (startSession will be called from waiting room)
      setCurrentSessionId(sessionId);
      navigate(`/sessions/${sessionId}/waiting`);
    } catch (err: any) {
      console.error('Failed to start session:', err);
      setError(err.message || 'Failed to start session');
    }
  };

  const handleJoinSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    // Navigate to waiting room first
    navigate(`/sessions/${sessionId}/waiting`);
  };

  const handleAcceptSession = async (sessionId: string) => {
    try {
      await sessionApi.acceptSession(sessionId);
      await loadSessions(); // Reload sessions after accepting
    } catch (err: any) {
      console.error('Failed to accept session:', err);
      setError(err.message || 'Failed to accept session');
    }
  };

  const handleRejectSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to reject this session request?')) {
      return;
    }
    try {
      await sessionApi.rejectSession(sessionId);
      await loadSessions(); // Reload sessions after rejecting
    } catch (err: any) {
      console.error('Failed to reject session:', err);
      setError(err.message || 'Failed to reject session');
    }
  };

  const getStatusColor = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CREATED':
      case 'ACCEPTED':
        return 'bg-blue-100 text-blue-800';
      case 'STARTED':
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'ENDED':
        return 'bg-gray-100 text-gray-800';
      case 'DECLINED':
      case 'CANCELED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingSessions = sessions.filter((s) => s.status === 'pending' || s.status === 'PENDING');
  const upcomingSessions = sessions.filter(
    (s) => (s.status === 'created' || s.status === 'accepted' || s.status === 'ACCEPTED') && !pendingSessions.includes(s)
  );
  const activeSessions = sessions.filter((s) => s.status === 'started' || s.status === 'active' || s.status === 'ACTIVE');
  const completedSessions = sessions.filter((s) => s.status === 'ended' || s.status === 'ENDED' || s.status === 'CANCELED' || s.status === 'DECLINED');

  return (
    <div className="wave-background min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-heading text-text-grey mb-2">Dashboard</h1>
            <p className="text-lg text-gray-600">Manage your sessions</p>
          </div>
          {user?.role === 'mentor' && (
            <Button
              variant="primary"
              onClick={() => navigate('/calendar')}
              className="mt-2"
            >
              View Calendar
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-purple"></div>
            <p className="mt-4 text-text-grey/70">Loading sessions...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Sessions (Mentor only) */}
            {user?.role === 'mentor' && pendingSessions.length > 0 && (
              <div>
                <h2 className="text-2xl font-heading text-text-grey mb-4">Pending Requests</h2>
                <div className="bg-white rounded-card-lg shadow-lg p-6 space-y-4">
                  {pendingSessions.map((session) => (
                    <div
                      key={session.session_id}
                      className="flex items-center justify-between p-4 border border-yellow-200 rounded-lg bg-yellow-50"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-text-grey">Session {session.session_id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">
                          {session.scheduled_start_time
                            ? new Date(session.scheduled_start_time).toLocaleString()
                            : 'No scheduled time'}
                        </p>
                        {session.mentee_goal && (
                          <p className="text-sm text-gray-500 mt-1">Goal: {session.mentee_goal.substring(0, 100)}...</p>
                        )}
                        <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          PENDING
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="primary" 
                          onClick={() => handleAcceptSession(session.session_id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleRejectSession(session.session_id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                        <Button variant="outline" onClick={() => navigate(`/sessions/${session.session_id}`)}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Sessions */}
            {activeSessions.length > 0 && (
              <div>
                <h2 className="text-2xl font-heading text-text-grey mb-4">Active Sessions</h2>
                <div className="bg-white rounded-card-lg shadow-lg p-6 space-y-4">
                  {activeSessions.map((session) => (
                    <div
                      key={session.session_id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-text-grey">Session {session.session_id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">
                          {session.scheduled_start_time
                            ? new Date(session.scheduled_start_time).toLocaleString()
                            : 'No scheduled time'}
                        </p>
                      </div>
                      <Button variant="primary" onClick={() => handleJoinSession(session.session_id)}>
                        Join Session
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Sessions */}
            {upcomingSessions.length > 0 && (
              <div>
                <h2 className="text-2xl font-heading text-text-grey mb-4">Upcoming Sessions</h2>
                <div className="bg-white rounded-card-lg shadow-lg p-6 space-y-4">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.session_id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-text-grey">Session {session.session_id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">
                          {session.scheduled_start_time
                            ? new Date(session.scheduled_start_time).toLocaleString()
                            : 'No scheduled time'}
                        </p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {session.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {user?.role === 'mentor' && (
                          <Button variant="primary" onClick={() => handleStartSession(session.session_id)}>
              Start Session
            </Button>
                        )}
                        <Button variant="outline" onClick={() => navigate(`/sessions/${session.session_id}`)}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Sessions */}
            {completedSessions.length > 0 && (
              <div>
                <h2 className="text-2xl font-heading text-text-grey mb-4">Completed Sessions</h2>
                <div className="bg-white rounded-card-lg shadow-lg p-6 space-y-4">
                  {completedSessions.map((session) => (
                    <div
                      key={session.session_id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-text-grey">Session {session.session_id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">
                          {session.scheduled_start_time
                            ? new Date(session.scheduled_start_time).toLocaleString()
                            : 'No scheduled time'}
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => navigate(`/sessions/${session.session_id}`)}>
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {sessions.length === 0 && (
              <div className="bg-white rounded-card-lg shadow-lg p-12 text-center">
                <p className="text-text-grey mb-4">No sessions found</p>
                {user?.role === 'mentee' && (
                  <Button variant="primary" onClick={() => navigate('/mentors')}>
                    Find a Mentor
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


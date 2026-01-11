/**
 * Manage Sessions Page - View and manage all sessions
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { SessionCard } from '../components/features/sessions/SessionCard';
import { sessionApi } from '../services/api';
import type { SessionListItem } from '../types/session';

export const ManageSessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await sessionApi.listSessions();
        setSessions(response.sessions);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load sessions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="wave-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading text-text-grey mb-2">Manage Sessions</h1>
            <p className="text-gray-600">View, edit, and manage all your sessions</p>
          </div>
          <Button variant="primary" size="lg" onClick={() => navigate('/sessions/create')}>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Start New Session
            </span>
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-card" role="alert" aria-live="assertive">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <svg
              className="animate-spin h-12 w-12 text-primary-purple mx-auto mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-gray-600">Loading sessions...</p>
          </div>
        )}

        {/* Sessions Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {sessions.map((session) => (
              <SessionCard
                key={session.session_id}
                sessionId={session.session_id}
                status={session.status}
                mentorId={session.mentor_id}
                patientId={session.patient_id}
                plannedDuration={session.planned_duration}
                onViewDetails={() => navigate(`/sessions/${session.session_id}`)}
                onStart={() => navigate(`/sessions/${session.session_id}/prestart`)}
                onEnd={() => navigate(`/sessions/${session.session_id}`)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && sessions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-card-lg shadow-lg">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-text-grey mb-2">No sessions yet</h3>
            <p className="text-gray-600 mb-4">Start your first session to get started</p>
            <Button variant="primary" onClick={() => navigate('/sessions/create')}>
              Start Session
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};


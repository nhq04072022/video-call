/**
 * Session Summary Page - Displays session summary after ending
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
// MainLayout is provided by route wrapper in App.tsx
import { Button } from '../components/ui/Button';
import { sessionApi } from '../services/api';
import type { SessionEndResponse } from '../types/session';

interface NextStep {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  status: 'pending' | 'completed';
}

export const SessionSummaryPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionData, setSessionData] = useState<SessionEndResponse | null>(
    (location.state as any)?.sessionData || null
  );
  const [isLoading, setIsLoading] = useState(!sessionData);
  const [error, setError] = useState<string | null>(null);

  // Fetch session data if not provided via state
  useEffect(() => {
    if (!sessionId || sessionData) return;

    const fetchSessionData = async () => {
      try {
        setIsLoading(true);
        // Note: We would need to get session end data from API
        // For now, we'll use mock data structure
        // In real implementation, you might need a new endpoint like getSessionSummary
        const status = await sessionApi.getSessionStatus(sessionId);
        // Since we don't have a summary endpoint, we'll create mock data
        // In production, this should come from the endSession response
        setSessionData({
          session_ended: true,
          end_timestamp: new Date().toISOString(),
          session_duration: 1800, // Mock: 30 minutes
          recording_ids: [],
          transcript_id: undefined,
          billing_summary_pointer: undefined,
          post_session_task_ids: ['task-1', 'task-2'],
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load session summary');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId, sessionData]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Mock next steps based on post_session_task_ids
  const nextSteps: NextStep[] = sessionData?.post_session_task_ids
    ? [
        {
          id: '1',
          title: 'Review Session Recording',
          description: 'Access the session recording for review',
          status: 'pending' as const,
        },
        {
          id: '2',
          title: 'Complete Follow-up Survey',
          description: 'Share your feedback about the session',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending' as const,
        },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple mx-auto mb-4" />
          <p className="text-text-grey">Loading session summary...</p>
        </div>
      </div>
    );
  }

  if (error && !sessionData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/sessions')}>Back to Sessions</Button>
        </div>
      </div>
    );
  }

  return (
      <div className="max-w-4xl mx-auto wave-background">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-text-grey mb-2">Session Completed</h1>
          <p className="text-gray-600">Session {sessionId?.slice(0, 8)}... has been successfully ended.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Session Duration */}
          <div className="bg-white rounded-card-lg shadow-lg p-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary-purple"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Session Duration</h3>
                <p className="text-2xl font-bold text-text-grey">
                  {sessionData ? formatDuration(sessionData.session_duration) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* End Timestamp */}
          <div className="bg-white rounded-card-lg shadow-lg p-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary-purple"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Session Ended</h3>
                <p className="text-lg font-semibold text-text-grey">
                  {sessionData?.end_timestamp
                    ? formatTimestamp(sessionData.end_timestamp)
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        {nextSteps.length > 0 && (
          <div className="bg-white rounded-card-lg shadow-lg p-6 mb-8 animate-fade-in">
            <h2 className="text-xl font-bold text-text-grey mb-6">Next Steps</h2>
            <div className="space-y-4">
              {nextSteps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 border-2 border-gray-300 rounded flex items-center justify-center">
                      {step.status === 'completed' && (
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-grey mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                    {step.dueDate && (
                      <p className="text-xs text-gray-500">
                        Due: {new Date(step.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/sessions')}
            className="flex-1"
          >
            Back to Sessions
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/sessions/create')}
            className="flex-1"
          >
            Start New Session
          </Button>
          {sessionId && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate(`/sessions/${sessionId}`)}
              className="flex-1"
            >
              View Session Details
            </Button>
          )}
        </div>
      </div>
  );
};


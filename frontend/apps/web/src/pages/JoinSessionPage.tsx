/**
 * Join Session Page - Join a session by entering session ID or code from URL
 */
import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { validateSessionId } from '../utils/validationUtils';
import { sessionApi } from '../services/api';
import { useSessionStore } from '../stores/sessionStore';

export const JoinSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const setCurrentSessionId = useSessionStore((state) => state.setCurrentSessionId);

  // Check for code parameter in URL
  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setSessionId(codeParam);
      setCurrentSessionId(codeParam);
      // Code is set, user can proceed to join
    }
  }, [searchParams, setCurrentSessionId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate session ID format
    const validationError = validateSessionId(sessionId);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Validate session exists by checking status
      const trimmedSessionId = sessionId.trim();
      await sessionApi.getSessionStatus(trimmedSessionId);
      
      // Store session ID and navigate to device testing page
      setCurrentSessionId(trimmedSessionId);
      navigate('/sessions/join', { replace: true });
    } catch (err: any) {
      // Session not found or other error
      if (err.response?.status === 404) {
        setError('Session not found. Please check the session ID and try again.');
      } else {
        setError(err.response?.data?.error || 'Failed to validate session. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="wave-background">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading text-text-grey mb-2">Join Session</h1>
          <p className="text-gray-600">Enter the session ID to join an existing session</p>
        </div>

        {/* Join Form */}
        <div className="bg-white rounded-card-lg shadow-2xl p-8 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Error message */}
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-4 bg-red-50 border border-red-200 rounded-card"
              >
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            {/* Session ID Input */}
            <div>
              <label
                htmlFor="session-id"
                className="block text-sm font-medium text-text-grey mb-2"
              >
                Session ID
              </label>
              <input
                type="text"
                id="session-id"
                value={sessionId}
                onChange={(e) => {
                  setSessionId(e.target.value);
                  setError(null);
                }}
                placeholder="Enter session ID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent min-h-[44px]"
                aria-required="true"
                {...(error ? { 'aria-invalid': 'true' } : {})}
                aria-describedby={error ? 'session-id-error' : 'session-id-description'}
                disabled={isLoading}
                autoFocus
              />
              <p id="session-id-description" className="sr-only">
                Enter the unique session ID provided by the session organizer
              </p>
              {error && (
                <p id="session-id-error" className="mt-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-card p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">How to get a Session ID?</p>
                  <p className="text-blue-700">
                    The session organizer will provide you with a unique session ID. 
                    Enter it above to join the session.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate(-1)}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!sessionId.trim() || isLoading}
                className="flex-1"
                aria-label={isLoading ? 'Joining session...' : 'Join Session'}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Joining...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Join Session
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


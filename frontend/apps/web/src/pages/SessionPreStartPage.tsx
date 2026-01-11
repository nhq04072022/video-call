import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionStartingModal } from '../components/features/sessions/SessionStartingModal';
import { Button } from '../components/ui/Button';
import { useSessionStatus } from '../hooks/useSessionStatus';
import { useAuth } from '../hooks/useAuth';
import { sessionApi } from '../services/api';
import { useSessionStore } from '../stores/sessionStore';
import { useLiveKit } from '../hooks/useLiveKit';
import { VideoTrack } from '../components/features/sessions/VideoTrack';
import { NetworkQualityBadge } from '../components/features/sessions/NetworkQualityBadge';
import type { Participant } from '../types/session';

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export const SessionPreStartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  
  // Redirect if no session ID in store
  useEffect(() => {
    if (!currentSessionId) {
      navigate('/sessions');
    }
  }, [currentSessionId, navigate]);
  const [showStartingModal, setShowStartingModal] = useState(false);
  const [timeoutError, setTimeoutError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(TIMEOUT_MS);

  // LiveKit hook for video feed
  const {
    localParticipant,
    isConnected: isLiveKitConnected,
    connectionQuality,
    connect: connectLiveKit,
    disconnect: disconnectLiveKit,
  } = useLiveKit({
    sessionId: currentSessionId || '',
    participantRole: (user?.role as 'mentor' | 'patient') || 'patient',
    onError: (err) => {
      console.error('LiveKit connection error in prestart:', err);
    },
  });

  // Connect to LiveKit when component mounts
  useEffect(() => {
    if (currentSessionId && !isLiveKitConnected) {
      connectLiveKit();
    }
    // Note: We don't disconnect on unmount here to keep connection stable
    // Connection will be cleaned up when navigating away from session pages
  }, [currentSessionId, isLiveKitConnected, connectLiveKit]);

  // Poll session status
  const { participants, readyCount, isLoading, error } = useSessionStatus({
    sessionId: currentSessionId || '',
    enabled: !!currentSessionId,
    interval: 2000,
  });

  const totalCount = 2; // Expected: 2 participants (mentor + patient)
  const allReady = readyCount >= totalCount;

  // Timeout handling
  useEffect(() => {
    if (!currentSessionId || allReady) return;

    const timeout = setTimeout(() => {
      if (readyCount < totalCount) {
        setTimeoutError('Timeout: The other participant did not join in time. Please try again.');
      }
    }, TIMEOUT_MS);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          clearInterval(countdownInterval);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(countdownInterval);
    };
  }, [currentSessionId, readyCount, totalCount, allReady]);

  // Reset timeout when ready count changes
  useEffect(() => {
    if (allReady) {
      setTimeRemaining(TIMEOUT_MS);
      setTimeoutError(null);
    }
  }, [allReady]);

  const handleStartSession = async () => {
    if (!allReady || !currentSessionId) return;

    try {
      // Only mentor can start session
      if (user?.role !== 'mentor') {
        alert('Only the mentor can start the session');
        return;
      }

      setShowStartingModal(true);
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const handleModalComplete = async () => {
    if (!currentSessionId) return;

    try {
      // Call start session API
      await sessionApi.startSession(currentSessionId);
      setShowStartingModal(false);
      navigate('/sessions/active');
    } catch (err) {
      console.error('Failed to start session:', err);
      setShowStartingModal(false);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get current user's participant info
  const currentUserParticipant = participants.find(
    (p) => p.id === user?.id || p.role === user?.role
  ) || {
    id: user?.id || 'you',
    role: user?.role || 'mentor',
    display_name: user?.name || 'You',
  };

  // Get other participant
  const otherParticipant = participants.find(
    (p) => p.id !== user?.id && p.role !== user?.role
  ) || {
    id: 'patient',
    role: 'patient',
    display_name: 'Waiting for participant...',
  };

  // Get other participant name for header (fallback to default)
  const otherParticipantName = otherParticipant.display_name && otherParticipant.id !== 'patient'
    ? otherParticipant.display_name
    : null;

  // Get local video track
  const localVideoTrack = localParticipant?.videoTrackPublications?.values().next().value?.track || null;
  
  // Determine role label
  const userRoleLabel = currentUserParticipant.role === 'mentor' ? 'Mentorship Provider' : 'Patient';

  return (
    <>
      {showStartingModal && <SessionStartingModal onComplete={handleModalComplete} />}
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary-purple to-primary-purple-accent wave-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-purple to-primary-purple-accent py-6 px-4 text-center shadow-lg">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-3xl font-heading text-white tracking-tight">Lifely</h1>
          </div>
          <p className="text-white text-lg font-medium">
            Mentorship Session{otherParticipantName ? `: ${otherParticipantName}` : ''}
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-8 relative z-10">
          <div 
            className="bg-white w-full max-w-5xl shadow-2xl p-10 rounded-card-lg animate-fade-in"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Section - Self View */}
              <div className="flex flex-col items-center">
                <div 
                  className="relative w-full mb-6 overflow-hidden"
                  style={{ 
                    borderRadius: '16px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
                  }}
                >
                  {localVideoTrack ? (
                    <VideoTrack
                      track={localVideoTrack}
                      participantName={currentUserParticipant.display_name || 'You'}
                      participantRole={userRoleLabel as 'mentor' | 'patient' | 'Mentorship Provider'}
                      isLocal={true}
                    />
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                      {/* Status Badge - Top Right */}
                      <div className="absolute top-4 right-4 z-10">
                        <NetworkQualityBadge quality={connectionQuality} />
                      </div>
                      
                      {/* Placeholder */}
                      <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-300 to-purple-400 flex items-center justify-center shadow-xl overflow-hidden">
                          <svg className="w-24 h-24 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <p className="text-gray-900 font-semibold text-lg mb-2">
                    You ({userRoleLabel})
                  </p>
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Connected</span>
                  </div>
                </div>
              </div>

              {/* Right Section - Participant Status */}
              <div className="flex flex-col justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">
                    Participants: {readyCount}/{totalCount} Ready
                  </h2>

                  {/* Error message */}
                  {(error || timeoutError) && (
                    <div
                      role="alert"
                      aria-live="assertive"
                      className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <p className="text-sm font-medium text-red-800">
                        {timeoutError || error?.message || 'An error occurred'}
                      </p>
                    </div>
                  )}

                  {/* Timeout warning */}
                  {!allReady && timeRemaining < 60000 && timeRemaining > 0 && (
                    <div
                      role="status"
                      aria-live="polite"
                      className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <p className="text-sm font-medium text-yellow-800">
                        Time remaining: {formatTime(timeRemaining)}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-5 mb-8">
                    {/* Current User */}
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <svg className="w-7 h-7 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-semibold text-base">
                          You ({userRoleLabel}) - Connected
                        </p>
                      </div>
                    </div>

                    {/* Other Participant */}
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {otherParticipant.id !== 'patient' ? (
                          <svg className="w-7 h-7 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-300 animate-pulse flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-semibold text-base">
                          {otherParticipant.display_name} ({otherParticipant.role === 'mentor' ? 'Mentor' : 'Patient'}) - {otherParticipant.id !== 'patient' ? 'Ready to start' : 'Waiting...'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {allReady && (
                    <p className="text-gray-700 text-base mb-8 leading-relaxed">
                      All participants are ready. You can start the session.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleStartSession}
                    disabled={!allReady || user?.role !== 'mentor' || isLoading}
                    variant="primary"
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary-purple to-primary-purple-accent hover:from-primary-purple-dark hover:to-primary-purple"
                    aria-label={allReady ? 'Start session' : 'Waiting for all participants to be ready'}
                  >
                    {isLoading ? 'Loading...' : 'Start Session'}
                  </Button>
                  
                  {user?.role !== 'mentor' && (
                    <p className="text-sm text-gray-600 text-center">
                      Only the mentor can start the session
                    </p>
                  )}

                  <Button
                    onClick={() => navigate(-1)}
                    variant="secondary"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Pattern at Bottom */}
        <div className="relative h-40 overflow-hidden mt-auto">
          <svg
            className="absolute bottom-0 w-full h-full"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ fill: '#9E2B9D', opacity: 0.3 }}
          >
            <path d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
          <svg
            className="absolute bottom-0 w-full h-full"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ fill: '#E0BBE4', opacity: 0.4 }}
          >
            <path d="M0,160L48,170.7C96,181,192,203,288,213.3C384,224,480,224,576,208C672,192,768,160,864,154.7C960,149,1056,171,1152,181.3C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </div>
    </>
  );
};


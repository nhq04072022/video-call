/**
 * Session Waiting Room Page
 * Shows participants and allows mentor to start the session when both are ready
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RoomEvent, DataPacket_Kind } from 'livekit-client';
import { useLiveKit, sharedRoomRefs } from '../hooks/useLiveKit';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import { sessionApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { DEFAULT_SESSION_ID } from '../config/session';

export const SessionWaitingPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId: urlSessionId } = useParams<{ sessionId?: string }>();
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const setCurrentSessionId = useSessionStore((state) => state.setCurrentSessionId);
  const user = useAuthStore((state) => state.user);
  
  // Priority: URL param > Store > Default
  useEffect(() => {
    if (urlSessionId) {
      setCurrentSessionId(urlSessionId);
    }
  }, [urlSessionId, setCurrentSessionId]);
  
  const sessionId = urlSessionId || currentSessionId || DEFAULT_SESSION_ID;
  const isMentor = user?.role?.toLowerCase() === 'mentor' || user?.role === 'MENTOR';
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEnteredWaitingRoom, setHasEnteredWaitingRoom] = useState(false);
  const [isNavigatingToActive, setIsNavigatingToActive] = useState(false);

  // LiveKit hook - connect to room but don't publish tracks yet (waiting mode)
  const {
    participants,
    localParticipant,
    room,
    isConnected,
    isConnecting,
    error: liveKitError,
    connect,
    disconnect,
  } = useLiveKit({
    sessionId: sessionId,
    participantRole: isMentor ? 'mentor' : 'patient',
    onConnected: () => {
      console.log('Connected to waiting room');
    },
    onDisconnected: () => {
      console.log('Disconnected from waiting room');
    },
    onError: (error) => {
      console.error('LiveKit error in waiting room:', error);
      setError(error.message);
    },
  });

  // Connect to LiveKit when component mounts
  useEffect(() => {
    if (!sessionId || sessionId === DEFAULT_SESSION_ID) {
      return; // No session ID, nothing to connect to
    }

    // Mark that we've entered waiting room
    setHasEnteredWaitingRoom(true);
    
    const connectTimer = setTimeout(() => {
      connect();
    }, 500);

    // CRITICAL: Single cleanup function - only disconnect if not navigating to active page
    // This prevents the mentor from disconnecting when clicking "Start Session"
    // which would cause the mentee to also disconnect
    return () => {
      clearTimeout(connectTimer);
      // Only disconnect if not navigating to active page
      if (!isNavigatingToActive) {
        console.log('[SessionWaitingPage] Cleanup: Disconnecting from room (not navigating to active)');
        disconnect();
      } else {
        console.log('[SessionWaitingPage] Cleanup: Skipping disconnect (navigating to active page)');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isNavigatingToActive]);

  // Count total participants (including local participant)
  const totalParticipants = isConnected ? (participants.length + (localParticipant ? 1 : 0)) : 0;
  const isReady = totalParticipants >= 2; // Both mentor and mentee
  
  // Track when we entered waiting room (for redirect protection)
  const [waitingRoomEnterTime, setWaitingRoomEnterTime] = useState<number | null>(null);

  // Set waiting room enter time when we fully connect
  useEffect(() => {
    if (hasEnteredWaitingRoom && isConnected && localParticipant && !waitingRoomEnterTime) {
      const enterTime = Date.now();
      setWaitingRoomEnterTime(enterTime);
      console.log('[SessionWaitingPage] Entered waiting room at:', new Date(enterTime).toISOString());
    }
  }, [hasEnteredWaitingRoom, isConnected, localParticipant, waitingRoomEnterTime]);

  // Poll session status to detect when mentor starts session (for mentee)
  // This is a backup mechanism in case data channel message is missed
  // CRITICAL: Only redirect if session was ACCEPTED when we joined and then became ACTIVE
  useEffect(() => {
    if (!sessionId || sessionId === DEFAULT_SESSION_ID || isMentor) {
      return; // Only poll for mentees
    }

    // Don't start polling until we've entered waiting room AND connection is established
    // AND we have at least seen ourselves as a participant (ensure we're fully connected)
    if (!hasEnteredWaitingRoom || !isConnected || !localParticipant || !waitingRoomEnterTime) {
      return;
    }

    let pollCount = 0;
    let initialSessionStatus: string | null = null; // Track initial status when we joined
    const maxPolls = 300; // Poll for up to 5 minutes (300 * 1s)
    let pollInterval: NodeJS.Timeout | null = null;

    const pollSessionStatus = async () => {
      pollCount++;
      if (pollCount > maxPolls) {
        console.log('[SessionWaitingPage] Stopped polling after max attempts');
        if (pollInterval) {
          clearInterval(pollInterval);
        }
        return;
      }

      try {
        const sessionDetail = await sessionApi.getSessionDetail(sessionId);
        const timeInWaitingRoom = Date.now() - waitingRoomEnterTime;
        
        // CRITICAL: On first poll, check if session is already ACTIVE
        // If it is, we should NOT redirect (session was already active before we joined)
        if (pollCount === 1) {
          initialSessionStatus = sessionDetail.status?.toUpperCase() || 'UNKNOWN';
          console.log('[SessionWaitingPage] Initial session status when entered waiting room:', initialSessionStatus);
          
          // If session is already ACTIVE when we join, don't auto-redirect
          // User should be in waiting room and wait for mentor to send explicit start signal
          if (initialSessionStatus === 'ACTIVE') {
            console.log('[SessionWaitingPage] Session is already ACTIVE when we joined - will not auto-redirect. Waiting for mentor to start.');
            // Don't redirect, but continue polling in case session restarts
            return;
          }
        }
        
        // CRITICAL: Only redirect if:
        // 1. Session status changed from ACCEPTED to ACTIVE (mentor just started it)
        // 2. We've been in waiting room for at least 5 seconds (avoid premature redirect)
        // 3. We've polled at least 3 times (3 seconds minimum)
        const sessionIsActive = sessionDetail.status?.toUpperCase() === 'ACTIVE';
        const statusChanged = initialSessionStatus && initialSessionStatus !== 'ACTIVE' && sessionIsActive;
        const shouldRedirect = (
          statusChanged && // Status changed from ACCEPTED to ACTIVE
          timeInWaitingRoom >= 5000 && // At least 5 seconds in waiting room
          pollCount >= 3 // At least 3 polls (3 seconds)
        );
        
        if (shouldRedirect) {
          console.log('[SessionWaitingPage] Session started detected via polling (status changed), navigating to active page', {
            initialStatus: initialSessionStatus,
            currentStatus: sessionDetail.status,
            timeInWaitingRoomMs: timeInWaitingRoom,
            pollCount
          });
          if (pollInterval) {
            clearInterval(pollInterval);
          }
          // CRITICAL: Set flag BEFORE navigating to prevent disconnect in cleanup
          setIsNavigatingToActive(true);
          navigate(`/sessions/${sessionId}/active`);
        } else if (sessionIsActive && statusChanged) {
          // Session just became active but we haven't been in waiting room long enough
          console.log('[SessionWaitingPage] Session just became ACTIVE but waiting for minimum wait time', {
            timeInWaitingRoomMs: timeInWaitingRoom,
            remainingMs: 5000 - timeInWaitingRoom
          });
        }
      } catch (err) {
        console.error('[SessionWaitingPage] Error polling session status:', err);
        // Don't show error to user, just log it
      }
    };

    // Start polling after a delay to ensure we're fully in waiting room
    const startPollingTimer = setTimeout(() => {
      console.log('[SessionWaitingPage] Starting to poll session status');
      // Poll every 1 second for faster response (backup to data channel)
      pollInterval = setInterval(pollSessionStatus, 1000);
    }, 2000); // Wait 2 seconds before starting to poll
    
    return () => {
      clearTimeout(startPollingTimer);
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [sessionId, isMentor, navigate, isConnected, hasEnteredWaitingRoom, localParticipant, waitingRoomEnterTime]);
  
  // Listen for data messages (e.g., session_started notification from mentor)
  // This is the PRIMARY mechanism for mentee to know when session starts (real-time)
  useEffect(() => {
    if (!room || !isConnected || isMentor) {
      return; // Only listen for mentees, mentors navigate directly
    }

    const handleDataReceived = (payload: Uint8Array, participant?: any, kind?: DataPacket_Kind, topic?: string) => {
      try {
        const messageStr = new TextDecoder().decode(payload);
        console.log('[SessionWaitingPage] Received data message:', messageStr);
        const message = JSON.parse(messageStr);
        
        if (message.type === 'session_started' && message.sessionId === sessionId) {
          console.log('[SessionWaitingPage] Received session_started notification via data channel, navigating to active page immediately');
          // CRITICAL: Set flag BEFORE navigating to prevent disconnect in cleanup
          setIsNavigatingToActive(true);
          // Navigate immediately when receiving data message
          navigate(`/sessions/${sessionId}/active`);
        }
      } catch (err) {
        console.warn('[SessionWaitingPage] Error parsing data message:', err);
      }
    };

    console.log('[SessionWaitingPage] Setting up data channel listener for session_started messages');
    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      console.log('[SessionWaitingPage] Removing data channel listener');
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, isConnected, sessionId, navigate, isMentor]);

  // Debug logging
  useEffect(() => {
    console.log('[SessionWaitingPage] State update:', {
      isConnected,
      isConnecting,
      participantsCount: participants.length,
      localParticipant: localParticipant?.identity || 'none',
      localParticipantName: localParticipant?.name || 'none',
      remoteParticipants: participants.map(p => ({ identity: p.identity, name: p.name })),
      totalParticipants,
      isReady,
      sessionId,
      isMentor,
      roomState: room?.state || 'no room'
    });
  }, [isConnected, isConnecting, participants, localParticipant, totalParticipants, isReady, sessionId, isMentor, room]);

  const handleStartSession = async () => {
    if (!isMentor) {
      setError('Only mentors can start sessions');
      return;
    }

    if (!isReady) {
      setError('Please wait for both participants to join');
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      // Call backend API to start session
      await sessionApi.startSession(sessionId);
      console.log('[SessionWaitingPage] Session started via API, status updated to ACTIVE');
      
      // Send data message to notify other participants (mentee) that session has started
      // This provides real-time notification - mentee will receive this and navigate immediately
      if (localParticipant && room) {
        try {
          const message = JSON.stringify({ 
            type: 'session_started', 
            sessionId,
            timestamp: new Date().toISOString()
          });
          const data = new Uint8Array(new TextEncoder().encode(message));
          await localParticipant.publishData(data, { reliable: true });
          console.log('[SessionWaitingPage] Sent session_started notification to participants via data channel');
          
          // Wait a moment for data message to be sent
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (dataErr) {
          console.warn('[SessionWaitingPage] Could not send data message:', dataErr);
          // Continue anyway - polling will handle it
        }
      }
      
      // CRITICAL: Check room state before navigating
      // Only navigate if room is connected - if disconnected, wait for reconnection
      if (room && room.state === 'disconnected') {
        console.warn('[SessionWaitingPage] Room is disconnected, waiting for reconnection before navigating...');
        // Wait for room to reconnect (max 5 seconds)
        let reconnectAttempts = 0;
        while (room.state === 'disconnected' && reconnectAttempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 500));
          reconnectAttempts++;
        }
        
        if (room.state === 'disconnected') {
          setError('Connection lost. Please refresh the page and try again.');
          setIsStarting(false);
          return;
        }
      }
      
      // CRITICAL: Set flag BEFORE navigating to prevent disconnect in cleanup
      // This ensures the room connection is maintained when transitioning to active page
      setIsNavigatingToActive(true);
      
      // CRITICAL: Ensure room is stored in sharedRoomRefs before navigating
      // This allows SessionActivePage to reuse the same room connection
      // Only store if room is connected or reconnecting
      if (room && sessionId && (room.state === 'connected' || room.state === 'reconnecting')) {
        sharedRoomRefs.set(sessionId, { room, sessionId });
        console.log('[SessionWaitingPage] ✓ Room stored in sharedRoomRefs before navigation:', {
          sessionId,
          roomName: room.name,
          roomState: room.state,
          participantsCount: room.remoteParticipants.size + (room.localParticipant ? 1 : 0)
        });
      } else {
        console.warn('[SessionWaitingPage] ⚠ Cannot store room - state is disconnected:', {
          roomState: room?.state,
          hasRoom: !!room
        });
      }
      
      // CRITICAL: Longer delay to ensure flag and sharedRoomRefs are fully set
      // This prevents race condition where cleanup runs before flag is set
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Navigate mentor to active session page
      console.log('[SessionWaitingPage] Navigating mentor to active session (will NOT disconnect)');
      navigate(`/sessions/${sessionId}/active`);
    } catch (err: any) {
      console.error('Failed to start session:', err);
      setError(err.message || 'Failed to start session');
      setIsStarting(false);
    }
  };

  if (isConnecting) {
    return (
      <div className="wave-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple mx-auto mb-4" />
          <p className="text-text-grey">Connecting to waiting room...</p>
        </div>
      </div>
    );
  }

  if (liveKitError && !isConnected && !isConnecting) {
    return (
      <div className="wave-background min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white rounded-card-lg shadow-lg p-8">
          <p className="text-red-600 mb-4 font-semibold">Connection Error</p>
          <p className="text-text-grey mb-6 text-sm">{liveKitError.message}</p>
          <div className="flex gap-3 justify-center">
            <Button 
              variant="primary" 
              onClick={() => {
                setError(null);
                connect();
              }}
              disabled={isConnecting}
            >
              {isConnecting ? 'Reconnecting...' : 'Retry Connection'}
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate(`/sessions/${sessionId}`)}
            >
              Back to Session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wave-background min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-card-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-text-dark mb-2">Waiting Room</h1>
        <p className="text-text-grey mb-6">Waiting for participants to join...</p>

        {/* Connection Status */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-text-grey">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Participants List */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-text-dark mb-4">
            Participants: {totalParticipants}/2 {isReady ? 'Ready' : ''}
          </h2>
          <div className="space-y-3">
            {/* Local Participant (You) */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary-purple flex items-center justify-center text-white font-semibold">
                {user?.full_name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <p className="font-medium">{user?.full_name || user?.name || 'You'}</p>
                <p className="text-sm text-text-grey">
                  {isMentor ? 'Mentorship Provider' : 'Patient'} • Connected
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-green-600 font-medium">✓</span>
              </div>
            </div>

            {/* Remote Participants */}
            {participants.map((participant, index) => {
              const isRemoteMentor = participant.name?.toLowerCase().includes('mentor') || 
                                     participant.identity?.toLowerCase().includes('mentor');
              const isRemoteMentee = participant.name?.toLowerCase().includes('mentee') || 
                                     participant.name?.toLowerCase().includes('patient') ||
                                     participant.identity?.toLowerCase().includes('mentee') ||
                                     participant.identity?.toLowerCase().includes('patient');
              
              return (
                <div
                  key={participant.identity || participant.sid || index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-purple flex items-center justify-center text-white font-semibold">
                    {participant.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{participant.name || 'Participant'}</p>
                    <p className="text-sm text-text-grey">
                      {isRemoteMentor 
                        ? 'Mentorship Provider' 
                        : isRemoteMentee 
                        ? 'Patient' 
                        : isMentor 
                        ? 'Patient' 
                        : 'Mentorship Provider'} • {isReady ? 'Ready to start' : 'Connected'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-green-600 font-medium">✓</span>
                  </div>
                </div>
              );
            })}

            {/* Waiting for second participant */}
            {totalParticipants < 2 && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-50">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 font-semibold">
                  ?
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-grey">Waiting for participant...</p>
                  <p className="text-sm text-text-grey">The other participant will appear here</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* Status Message */}
        {isReady && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 text-center">
              All participants are ready. {isMentor ? 'You can start the session.' : 'Waiting for mentor to start the session.'}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Start Button (Mentor only) */}
        {isMentor && (
          <div className="space-y-2">
            <Button
              variant="primary"
              onClick={handleStartSession}
              disabled={!isReady || isStarting}
              className="w-full"
            >
              {isStarting
                ? 'Starting Session...'
                : isReady
                ? 'Start Session'
                : `Waiting for participants (${totalParticipants}/2)`}
            </Button>
            {!isReady && (
              <p className="text-sm text-center text-text-grey">
                Both participants must be connected before starting
              </p>
            )}
          </div>
        )}

        {/* Waiting for Mentor Button (Mentee only) */}
        {!isMentor && (
          <div className="mt-6">
            <Button
              variant="secondary"
              disabled={true}
              className="w-full py-3 text-lg font-semibold cursor-not-allowed opacity-75"
            >
              Waiting for Mentorship Provider
            </Button>
            <p className="text-sm text-text-grey mt-2 text-center">
              {isReady 
                ? 'All participants are ready. Waiting for mentor to start the session...'
                : 'Waiting for mentor to join...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

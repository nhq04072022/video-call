/**
 * SessionActivePage - Professional Video Call Interface
 * Responsive, auto-fit layout like Google Meet/Zoom
 * WCAG 2.1 AA compliant
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveKit, sharedRoomRefs } from '../hooks/useLiveKit';
import { VideoGrid } from '../components/features/sessions/VideoGrid';
import { VideoControls } from '../components/features/sessions/VideoControls';
import { EndSessionModal } from '../components/features/sessions/EndSessionModal';
import { Button } from '../components/ui/Button';
import { useKeyboardShortcuts } from '../components/features/sessions/AccessibilityHelpers';
import { sessionApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import { DEFAULT_SESSION_ID } from '../config/session';
import { Track } from 'livekit-client';

export const SessionActivePage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId: urlSessionId } = useParams<{ sessionId?: string }>();
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const setCurrentSessionId = useSessionStore((state) => state.setCurrentSessionId);
  const user = useAuthStore((state) => state.user);
  
  useEffect(() => {
    if (urlSessionId) {
      setCurrentSessionId(urlSessionId);
    }
  }, [urlSessionId, setCurrentSessionId]);
  
  const sessionId = urlSessionId || currentSessionId || DEFAULT_SESSION_ID;
  const [sessionTime, setSessionTime] = useState(0);
  const [showSuccessNotification, setShowSuccessNotification] = useState(true);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [participantRole, setParticipantRole] = useState<'mentor' | 'patient'>('mentor');

  // LiveKit hook
  const {
    room,
    participants,
    localParticipant,
    isConnected,
    isConnecting,
    isPeerConnected,
    error: liveKitError,
    connect,
    disconnect,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    screenShareTrack,
  } = useLiveKit({
    sessionId: sessionId,
    participantRole,
    onConnected: () => {
      setShowSuccessNotification(true);
      setTimeout(() => setShowSuccessNotification(false), 3000);
    },
    onDisconnected: () => {
      navigate('/sessions');
    },
    onError: (error) => {
      console.error('LiveKit error:', error);
    },
  });

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'm': toggleMute,
    'v': toggleVideo,
    's': toggleScreenShare,
    'escape': () => setIsAIPanelOpen(false),
  });

  // Connect on mount
  useEffect(() => {
    if (sessionId && sessionId !== DEFAULT_SESSION_ID) {
      const userRole = (user?.role as 'mentor' | 'patient') || 'mentor';
      setParticipantRole(userRole);
      
      const connectTimer = setTimeout(() => {
        connect();
      }, 500);

      return () => {
        clearTimeout(connectTimer);
        const currentRoom = sharedRoomRefs.get(sessionId);
        if (!currentRoom || currentRoom.room?.state === 'disconnected') {
          disconnect();
        }
      };
    }
  }, [sessionId]);

  // Enable camera/mic after peer connection
  useEffect(() => {
    if (isPeerConnected && localParticipant && room?.state === 'connected') {
      const enableMedia = async () => {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasVideo = devices.some(d => d.kind === 'videoinput');
          const hasAudio = devices.some(d => d.kind === 'audioinput');
          
          if (hasVideo) {
            try {
              await localParticipant.setCameraEnabled(true);
            } catch (e) {}
          }
          if (hasAudio) {
            try {
              await localParticipant.setMicrophoneEnabled(true);
            } catch (e) {}
          }
        } catch (e) {}
      };
      setTimeout(enableMedia, 1000);
    }
  }, [isPeerConnected, localParticipant, room]);

  // Success notification timer
  useEffect(() => {
    if (showSuccessNotification) {
      const timer = setTimeout(() => setShowSuccessNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessNotification]);

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => setSessionTime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndSession = () => setShowEndSessionModal(true);

  const handleConfirmEnd = async (endReason: string, notes?: string) => {
    if (!sessionId) return;
    try {
      const endedBy = user?.id || 'current_user';
      const response = await sessionApi.endSession(sessionId, endedBy, endReason, { notes });
      disconnect();
      navigate(`/sessions/${sessionId}/summary`, { state: { sessionData: response } });
    } catch (error) {
      console.error('Failed to end session:', error);
      throw error;
    }
  };

  const handleEmergencyTerminate = async () => {
    if (!sessionId) return;
    if (window.confirm('Emergency termination will immediately end the session. Continue?')) {
      try {
        await sessionApi.emergencyTerminate(sessionId, {
          terminated_by: user?.id || 'current_user',
          emergency_reason: 'safety_concern',
          emergency_notes: 'Emergency termination from UI',
        });
        disconnect();
        navigate('/sessions');
      } catch (error) {
        console.error('Failed to emergency terminate:', error);
        disconnect();
      }
    }
  };

  // Get video tracks (excluding screen share)
  const localVideoTrack = useMemo(() => {
    if (!localParticipant?.videoTrackPublications) return null;
    const pub = Array.from(localParticipant.videoTrackPublications.values())
      .find(p => p.kind === 'video' && p.track && p.source !== Track.Source.ScreenShare);
    return pub?.track || null;
  }, [localParticipant]);

  const remoteVideoTracks = useMemo(() => {
    return participants.map(participant => {
      let track: any = null;
      if (participant.videoTrackPublications) {
        // Get camera video track (not screen share)
        const pub = Array.from(participant.videoTrackPublications.values())
          .find(p => p.kind === 'video' && p.track && p.source !== Track.Source.ScreenShare);
        track = pub?.track || null;
      }
      return { participant, track };
    });
  }, [participants]);

  // Get remote screen share tracks
  const remoteScreenShareTracks = useMemo(() => {
    return participants.map(participant => {
      let track: any = null;
      if (participant.videoTrackPublications) {
        // Get screen share track
        const pub = Array.from(participant.videoTrackPublications.values())
          .find(p => p.track && p.source === Track.Source.ScreenShare);
        track = pub?.track || null;
      }
      return { participant, track };
    }).filter(item => item.track !== null); // Only include participants who are screen sharing
  }, [participants]);

  const totalParticipants = (localParticipant ? 1 : 0) + participants.length;

  // Loading state
  if (isConnecting || (isConnected && !isPeerConnected)) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-400 animate-spin" style={{ animationDuration: '1.5s' }}></div>
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">
            {isConnected && !isPeerConnected ? 'Establishing connection...' : 'Connecting to session...'}
          </h2>
          <p className="text-purple-300 text-sm">Please wait while we set up your video call</p>
        </div>
      </div>
    );
  }

  // Error state
  if (liveKitError && !isConnected && !isConnecting) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-white/20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-semibold text-center mb-2">Connection Error</h2>
          <p className="text-gray-300 text-sm text-center mb-6">{liveKitError.message}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={connect} variant="primary" className="flex-1" disabled={isConnecting}>
              {isConnecting ? 'Reconnecting...' : 'Retry'}
            </Button>
            <Button onClick={() => navigate('/sessions')} variant="secondary" className="flex-1">
              Back to Sessions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Header - Brand colors */}
      <header className="flex-shrink-0 px-4 sm:px-6 py-3 z-20" style={{ background: 'linear-gradient(90deg, #A11692 0%, #A31694 100%)' }}>
        <div className="flex items-center justify-between">
          {/* Left: Logo & Timer */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-white text-sm">🌿</span>
              </div>
              <span className="text-white font-semibold text-lg hidden sm:block">Lifely</span>
            </div>
            
            {/* Session Timer */}
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <span className="hidden sm:inline">Session:</span>
              <span className="font-mono font-semibold bg-white/20 px-2 py-1 rounded">{formatTime(sessionTime)}</span>
            </div>
          </div>

          {/* Center: Status badges */}
          <div className="hidden md:flex items-center gap-3">
            {/* Recording */}
            <div className="flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span>Recording</span>
            </div>
            
            {/* Network Quality */}
            <div className="flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Connected</span>
            </div>
          </div>

          {/* Right: Success notification or participant count */}
          <div className="flex items-center gap-3">
            {showSuccessNotification ? (
              <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Session started</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white/20 text-white px-3 py-2 rounded-full text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{participants.length + 1}/2</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content - Video grid only (no AI panel) */}
      <main className="flex-1 flex min-h-0 overflow-hidden px-4 sm:px-6 py-4 pb-28">
        <div className="flex-1 min-w-0">
          <VideoGrid
            localParticipant={localParticipant}
            remoteParticipants={participants}
            localVideoTrack={localVideoTrack}
            remoteVideoTracks={remoteVideoTracks}
            localScreenShareTrack={screenShareTrack}
            remoteScreenShareTracks={remoteScreenShareTracks}
            isMuted={isMuted}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={isScreenSharing}
            className="h-full"
          />
        </div>
      </main>

      {/* Bottom control bar - Fixed at bottom center */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <VideoControls
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          isScreenSharing={isScreenSharing}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={toggleScreenShare}
          onEndSession={handleEndSession}
          onEmergencyTerminate={handleEmergencyTerminate}
        />
      </div>

      {/* End Session Modal */}
      <EndSessionModal
        isOpen={showEndSessionModal}
        onClose={() => setShowEndSessionModal(false)}
        onConfirm={handleConfirmEnd}
        sessionId={sessionId}
      />
    </div>
  );
};

export default SessionActivePage;

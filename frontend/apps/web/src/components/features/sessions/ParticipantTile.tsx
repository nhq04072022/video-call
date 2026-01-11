/**
 * ParticipantTile Component - Professional video tile
 * Google Meet/Zoom-like design with avatar fallback
 * Responsive and accessible
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Track, TrackPublication, RemoteParticipant, LocalParticipant } from 'livekit-client';

interface ParticipantTileProps {
  participant: RemoteParticipant | LocalParticipant | null;
  videoTrack?: Track | TrackPublication | null;
  audioTrack?: Track | TrackPublication | null;
  screenShareTrack?: Track | TrackPublication | null;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoEnabled?: boolean;
  isScreenSharing?: boolean;
  className?: string;
}

// Generate initials
const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Generate consistent avatar color - Brand Purple (#A11692)
const getAvatarGradient = (_name: string): string => {
  // Use brand gradient for consistency
  return 'from-[#A11692] to-[#A31694]';
};


export const ParticipantTile: React.FC<ParticipantTileProps> = ({
  participant,
  videoTrack,
  audioTrack,
  screenShareTrack,
  isLocal = false,
  isMuted = false,
  isVideoEnabled = true,
  isScreenSharing = false,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoAttached, setIsVideoAttached] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Participant info
  const participantName = participant?.name || participant?.identity || 'Participant';
  const initials = getInitials(participantName);
  const avatarGradient = getAvatarGradient(participantName);
  
  // Role detection
  const isMentor = participantName.toLowerCase().includes('mentor') || 
                   (participant?.identity || '').toLowerCase().includes('mentor');
  const displayName = isLocal ? 'You' : participantName;
  const roleLabel = isLocal ? '(Mentorship Provider)' : (isMentor ? '(Mentorship Provider)' : '(Patient)');

  // Get actual track
  const getActualTrack = useCallback((trackOrPub: Track | TrackPublication | null | undefined): Track | null => {
    if (!trackOrPub) return null;
    if (trackOrPub instanceof TrackPublication) return trackOrPub.track || null;
    return trackOrPub as Track;
  }, []);

  // Attach video track - runs when video ref or track changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      console.log('[ParticipantTile] No video element ref yet for:', participantName);
      return;
    }

    // Use screen share track if available and isScreenSharing is true
    const trackToUse = isScreenSharing && screenShareTrack ? screenShareTrack : videoTrack;
    const actualTrack = getActualTrack(trackToUse);

    console.log('[ParticipantTile] Attaching video track:', {
      participant: participantName,
      isScreenSharing,
      hasScreenShareTrack: !!screenShareTrack,
      hasVideoTrack: !!videoTrack,
      usingTrack: isScreenSharing && screenShareTrack ? 'screen' : 'video',
      actualTrack: actualTrack ? {
        kind: actualTrack.kind,
        sid: actualTrack.sid,
        mediaStreamTrack: !!actualTrack.mediaStreamTrack
      } : 'null'
    });

    // Clear previous video source
    if (video.srcObject) {
      video.srcObject = null;
    }

    if (!actualTrack) {
      console.log('[ParticipantTile] No actual track to attach for:', participantName);
      setIsVideoAttached(false);
      return;
    }

    if (actualTrack.kind !== 'video') {
      console.log('[ParticipantTile] Track is not video type:', actualTrack.kind);
      setIsVideoAttached(false);
      return;
    }

    try {
      // Attach the track to video element
      actualTrack.attach(video);
      setIsVideoAttached(true);
      console.log('[ParticipantTile] ✓ Video track attached successfully for:', participantName, {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState
      });

      // Force video to play
      video.play().catch(err => {
        console.warn('[ParticipantTile] Video autoplay blocked:', err.message);
      });
    } catch (err) {
      console.error('[ParticipantTile] Error attaching video:', err);
      setIsVideoAttached(false);
    }

    return () => {
      try {
        if (actualTrack) {
          actualTrack.detach(video);
          console.log('[ParticipantTile] Video track detached for:', participantName);
        }
      } catch (e) {
        // Ignore detach errors
      }
    };
  }, [videoTrack, screenShareTrack, isScreenSharing, getActualTrack, participantName]);

  // Speaking detection
  useEffect(() => {
    if (!participant || !audioTrack) return;
    const checkSpeaking = () => {
      if ('isSpeaking' in participant) {
        setIsSpeaking((participant as any).isSpeaking || false);
      }
    };
    const interval = setInterval(checkSpeaking, 100);
    return () => clearInterval(interval);
  }, [participant, audioTrack]);

  const actualVideoTrack = getActualTrack(videoTrack);
  const actualScreenShareTrack = getActualTrack(screenShareTrack);
  
  // Determine what to show: screen share takes priority if isScreenSharing
  const hasVideo = isScreenSharing 
    ? (actualScreenShareTrack && isVideoAttached) 
    : (actualVideoTrack && isVideoEnabled && isVideoAttached);

  // Debug log for render state
  console.log('[ParticipantTile] Render state:', {
    participant: participantName,
    isScreenSharing,
    isVideoAttached,
    hasVideo,
    hasScreenShareTrack: !!actualScreenShareTrack,
    hasVideoTrack: !!actualVideoTrack,
    isVideoEnabled,
    videoRefExists: !!videoRef.current
  });

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 group ${className}`}
      style={{
        boxShadow: isSpeaking ? '0 0 0 3px rgba(34, 197, 94, 0.8)' : 'none',
        transition: 'box-shadow 0.15s ease',
      }}
    >
      {/* Video element - always rendered at full size */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full ${
          isScreenSharing 
            ? 'object-contain bg-black' 
            : `object-cover ${isLocal ? 'transform scale-x-[-1]' : ''}`
        }`}
        playsInline
        autoPlay
        muted={isLocal || isScreenSharing}
      />
      
      {/* Avatar overlay - shown on top when no video is active */}
      <div 
        className={`absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 transition-opacity duration-300 ${
          (isScreenSharing && isVideoAttached) || (hasVideo && !isScreenSharing)
            ? 'opacity-0 pointer-events-none'
            : 'opacity-100'
        }`}
      >
        {/* Avatar */}
        <div 
          className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-2xl transition-transform duration-200`}
          style={{ transform: isSpeaking ? 'scale(1.05)' : 'scale(1)' }}
        >
          <span className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold select-none">
            {initials}
          </span>
        </div>
      </div>

      {/* Screen share badge - top left - Brand color */}
      {isScreenSharing && (
        <div className="absolute top-3 left-3 z-20">
          <div className="flex items-center gap-1.5 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg" style={{ backgroundColor: '#A11692' }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Presenting</span>
          </div>
        </div>
      )}

      {/* Bottom bar - Name label only */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
        <div className="flex items-center gap-2">
          {isMuted && (
            <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            </div>
          )}
          <span className="text-white text-sm font-medium drop-shadow-lg">
            {displayName} {roleLabel}
          </span>
        </div>
      </div>

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
    </div>
  );
};

export default ParticipantTile;

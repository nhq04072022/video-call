/**
 * VideoGrid Component - Professional responsive video layout
 * Auto-fit grid like Google Meet/Zoom
 * Supports 1-10 participants with optimal layout
 */
import React, { useMemo } from 'react';
import { LocalParticipant, RemoteParticipant, Track, TrackPublication } from 'livekit-client';
import { ParticipantTile } from './ParticipantTile';

// Helper to get actual track from publication
const getActualTrack = (trackOrPub: Track | TrackPublication | null | undefined): Track | null => {
  if (!trackOrPub) return null;
  if ('track' in trackOrPub && trackOrPub.track) return trackOrPub.track;
  if (trackOrPub instanceof Track) return trackOrPub;
  return trackOrPub as unknown as Track;
};

interface VideoGridProps {
  localParticipant: LocalParticipant | null;
  remoteParticipants: RemoteParticipant[];
  localVideoTrack?: Track | TrackPublication | null;
  remoteVideoTracks?: Array<{ participant: RemoteParticipant; track: Track | TrackPublication | null }>;
  localScreenShareTrack?: Track | TrackPublication | null;
  remoteScreenShareTracks?: Array<{ participant: RemoteParticipant; track: Track | TrackPublication | null }>;
  isMuted?: boolean;
  isVideoEnabled?: boolean;
  isScreenSharing?: boolean;
  className?: string;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  localParticipant,
  remoteParticipants,
  localVideoTrack,
  remoteVideoTracks = [],
  localScreenShareTrack,
  remoteScreenShareTracks = [],
  isMuted = false,
  isVideoEnabled = true,
  isScreenSharing = false,
  className = '',
}) => {
  // Get video tracks for remote participants
  const remoteParticipantData = useMemo(() => {
    return remoteParticipants.map(participant => {
      const videoTrackData = remoteVideoTracks.find(
        t => t.participant.identity === participant.identity
      );
      const screenShareTrackData = remoteScreenShareTracks.find(
        t => t.participant.identity === participant.identity
      );

      let audioTrack: Track | TrackPublication | null = null;
      if (participant.audioTrackPublications) {
        const pub = Array.from(participant.audioTrackPublications.values()).find(
          p => p.kind === 'audio' && p.track
        );
        audioTrack = pub || null;
      }

      // Check for camera video (not screen share) using Track.Source
      let participantVideoEnabled = false;
      if (participant.videoTrackPublications) {
        const pub = Array.from(participant.videoTrackPublications.values()).find(
          p => p.kind === 'video' && p.track && p.source !== Track.Source.ScreenShare
        );
        participantVideoEnabled = !!(pub?.track);
      }

      let participantMuted = true;
      if (participant.audioTrackPublications) {
        const pub = Array.from(participant.audioTrackPublications.values()).find(
          p => p.kind === 'audio' && p.track
        );
        participantMuted = !(pub?.track && !pub.isMuted);
      }

      // Also check for screen share directly from participant's publications
      let screenTrack = screenShareTrackData?.track || null;
      if (!screenTrack && participant.videoTrackPublications) {
        const screenPub = Array.from(participant.videoTrackPublications.values()).find(
          p => p.source === Track.Source.ScreenShare && p.track
        );
        screenTrack = screenPub?.track || null;
      }

      return {
        participant,
        videoTrack: videoTrackData?.track || null,
        audioTrack,
        screenShareTrack: screenTrack,
        isVideoEnabled: participantVideoEnabled,
        isMuted: participantMuted,
      };
    });
  }, [remoteParticipants, remoteVideoTracks, remoteScreenShareTracks]);

  const localAudioTrack = useMemo(() => {
    if (!localParticipant?.audioTrackPublications) return null;
    const pub = Array.from(localParticipant.audioTrackPublications.values()).find(
      p => p.kind === 'audio' && p.track
    );
    return pub || null;
  }, [localParticipant]);

  const totalParticipants = (localParticipant ? 1 : 0) + remoteParticipants.length;
  
  // Check if anyone is screen sharing
  const localHasScreenShare = isScreenSharing && getActualTrack(localScreenShareTrack);
  const remoteScreenSharer = remoteParticipantData.find(p => getActualTrack(p.screenShareTrack));
  const anyScreenSharing = !!localHasScreenShare || !!remoteScreenSharer;
  
  console.log('[VideoGrid] Screen share state:', {
    isScreenSharing,
    localHasScreenShare: !!localHasScreenShare,
    remoteScreenSharer: remoteScreenSharer?.participant?.name || 'none',
    anyScreenSharing,
    totalParticipants
  });

  // Determine grid layout based on participant count
  const getGridClass = (count: number): string => {
    if (count === 0) return 'grid-cols-1';
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2'; // Always 2 columns for 2 participants
    if (count === 3) return 'grid-cols-2 lg:grid-cols-3';
    if (count === 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 lg:grid-cols-3';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-3 lg:grid-cols-4';
  };

  // No participants - connecting
  if (totalParticipants === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 animate-pulse"></div>
            <div className="absolute inset-4 rounded-full bg-slate-700 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-white text-lg font-medium mb-2">Connecting...</h3>
          <p className="text-gray-400 text-sm">Setting up your video call</p>
        </div>
      </div>
    );
  }

  // Screen share layout - Main content on left, participants on right
  if (anyScreenSharing) {
    const isLocalSharing = !!localHasScreenShare;
    const screenShareParticipant = isLocalSharing ? localParticipant : remoteScreenSharer?.participant;
    const activeScreenShareTrack = isLocalSharing ? localScreenShareTrack : remoteScreenSharer?.screenShareTrack;

    const actualScreenTrack = getActualTrack(activeScreenShareTrack);
    console.log('[VideoGrid] Rendering screen share layout:', {
      isLocalSharing,
      screenShareParticipant: screenShareParticipant?.name || screenShareParticipant?.identity,
      hasTrack: !!actualScreenTrack,
      trackDetails: actualScreenTrack ? {
        kind: actualScreenTrack.kind,
        sid: actualScreenTrack.sid,
        source: actualScreenTrack.source,
        mediaStreamId: actualScreenTrack.mediaStreamTrack?.id,
        readyState: actualScreenTrack.mediaStreamTrack?.readyState
      } : null,
      rawTrackType: activeScreenShareTrack ? activeScreenShareTrack.constructor.name : 'null'
    });

    return (
      <div className={`flex flex-col sm:flex-row h-full p-2 sm:p-4 gap-3 ${className}`}>
        {/* Main screen share view */}
        <div className="flex-1 min-h-0 rounded-xl overflow-hidden bg-black relative order-1 sm:order-1">
          {screenShareParticipant && (
            <ParticipantTile
              key={`screenshare-${screenShareParticipant.identity}`}
              participant={screenShareParticipant}
              screenShareTrack={activeScreenShareTrack}
              isLocal={isLocalSharing}
              isVideoEnabled={true}
              isScreenSharing={true}
              className="h-full"
            />
          )}
          
        {/* Screen share label - Brand color */}
        <div className="absolute top-4 left-4 flex items-center gap-2 text-white px-3 py-1.5 text-sm font-medium shadow-lg z-20" style={{ backgroundColor: '#A11692', borderRadius: '9999px' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>{isLocalSharing ? 'You are presenting' : `${screenShareParticipant?.name || 'Someone'} is presenting`}</span>
        </div>
        </div>

        {/* Participant filmstrip - Right side on desktop, bottom on mobile */}
        <div className="flex-shrink-0 w-full sm:w-44 md:w-52 lg:w-60 order-2 sm:order-2">
          <div className="flex sm:flex-col gap-2 sm:gap-3 h-full overflow-x-auto sm:overflow-y-auto sm:overflow-x-hidden pb-1 sm:pb-0 sm:pr-1 scrollbar-thin scrollbar-thumb-white/20">
            {localParticipant && (
              <div className="flex-shrink-0 w-32 sm:w-full aspect-video">
                <ParticipantTile
                  participant={localParticipant}
                  videoTrack={localVideoTrack}
                  audioTrack={localAudioTrack}
                  isLocal={true}
                  isMuted={isMuted}
                  isVideoEnabled={isVideoEnabled}
                />
              </div>
            )}
            {remoteParticipantData.map((data) => (
              <div key={data.participant.identity} className="flex-shrink-0 w-32 sm:w-full aspect-video">
                <ParticipantTile
                  participant={data.participant}
                  videoTrack={data.videoTrack}
                  audioTrack={data.audioTrack}
                  isLocal={false}
                  isMuted={data.isMuted}
                  isVideoEnabled={data.isVideoEnabled}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Single participant - centered, max size
  if (totalParticipants === 1) {
    const participant = localParticipant || remoteParticipantData[0]?.participant;
    const isLocal = !!localParticipant;
    const videoTrack = isLocal ? localVideoTrack : remoteParticipantData[0]?.videoTrack;
    const audioTrack = isLocal ? localAudioTrack : remoteParticipantData[0]?.audioTrack;
    
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
          <ParticipantTile
            participant={participant}
            videoTrack={videoTrack}
            audioTrack={audioTrack}
            isLocal={isLocal}
            isMuted={isLocal ? isMuted : remoteParticipantData[0]?.isMuted}
            isVideoEnabled={isLocal ? isVideoEnabled : remoteParticipantData[0]?.isVideoEnabled}
            className="h-full"
          />
        </div>
        {isLocal && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
            <p className="text-gray-600 text-sm bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
              Waiting for others to join...
            </p>
          </div>
        )}
      </div>
    );
  }

  // Multi-participant grid - Brand design (2 tiles side by side)
  return (
    <div className={`h-full flex items-center justify-center p-2 sm:p-4 ${className}`}>
      <div className={`grid ${getGridClass(totalParticipants)} gap-4 sm:gap-6 w-full h-full max-w-[1400px] mx-auto`}>
        {/* Remote participants first */}
        {remoteParticipantData.map((data) => (
          <div key={data.participant.identity} className="overflow-hidden shadow-xl" style={{ borderRadius: '16px' }}>
            <ParticipantTile
              participant={data.participant}
              videoTrack={data.videoTrack}
              audioTrack={data.audioTrack}
              screenShareTrack={data.screenShareTrack}
              isLocal={false}
              isMuted={data.isMuted}
              isVideoEnabled={data.isVideoEnabled}
              isScreenSharing={!!data.screenShareTrack}
              className="h-full"
            />
          </div>
        ))}

        {/* Local participant (You) */}
        {localParticipant && (
          <div className="overflow-hidden shadow-xl" style={{ borderRadius: '16px' }}>
            <ParticipantTile
              participant={localParticipant}
              videoTrack={localVideoTrack}
              audioTrack={localAudioTrack}
              screenShareTrack={localScreenShareTrack}
              isLocal={true}
              isMuted={isMuted}
              isVideoEnabled={isVideoEnabled}
              isScreenSharing={isScreenSharing}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGrid;

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Room, RoomEvent, RemoteParticipant, LocalParticipant, Track, TrackPublication } from 'livekit-client';

interface LiveKitContextType {
  room: Room | null;
  participants: (RemoteParticipant | LocalParticipant)[];
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: (url: string, token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenShareEnabled: boolean;
}

const LiveKitContext = createContext<LiveKitContextType | undefined>(undefined);

export const LiveKitProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<(RemoteParticipant | LocalParticipant)[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);

  const updateParticipants = useCallback((currentRoom: Room) => {
    const allParticipants = [
      currentRoom.localParticipant,
      ...Array.from(currentRoom.remoteParticipants.values()),
    ];
    setParticipants(allParticipants);
  }, []);

  const connect = useCallback(async (url: string, token: string) => {
    try {
      setIsConnecting(true);
      setError(null);

      const { Room, RoomEvent } = await import('livekit-client');
      const newRoom = new Room();

      // Set up event listeners
      newRoom.on(RoomEvent.Connected, () => {
        console.log('Connected to room');
        setIsConnected(true);
        setIsConnecting(false);
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.Disconnected, (reason?: any) => {
        console.log('Disconnected from room', reason);
        // Don't immediately clear everything - might be reconnecting
        // Only fully disconnect if it's a client-initiated disconnect
        const reasonStr = reason?.toString() || '';
        if (reasonStr.includes('CLIENT_INITIATED') || reasonStr.includes('DUPLICATE')) {
          setIsConnected(false);
          setIsConnecting(false);
          setParticipants([]);
        } else {
          // For network issues, keep room state and let it try to reconnect
          setIsConnected(false);
          setIsConnecting(true); // Allow reconnection
        }
      });

      newRoom.on(RoomEvent.Reconnecting, () => {
        console.log('Reconnecting to room...');
        setIsConnecting(true);
      });

      newRoom.on(RoomEvent.Reconnected, () => {
        console.log('Reconnected to room');
        setIsConnected(true);
        setIsConnecting(false);
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.ParticipantConnected, () => {
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, () => {
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('Track subscribed:', {
          participant: participant.identity,
          source: publication.source,
          trackId: track.sid
        });
        updateParticipants(newRoom);
        // Update screen share state
        const hasScreenShare = Array.from(newRoom.localParticipant.trackPublications.values())
          .some(pub => pub.source === Track.Source.ScreenShare || pub.source === Track.Source.ScreenShareAudio);
        setIsScreenShareEnabled(hasScreenShare);
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, () => {
        updateParticipants(newRoom);
      });

      // Handle track published - ensure remote tracks are subscribed
      const handleTrackPublished = async (publication: TrackPublication, participant: RemoteParticipant | LocalParticipant) => {
        console.log('Track published:', {
          participant: participant.identity,
          source: publication.source,
          kind: publication.kind,
          isRemote: participant instanceof RemoteParticipant
        });
        
        // Auto-subscribe to remote video tracks
        if (participant instanceof RemoteParticipant && publication.kind === 'video') {
          try {
            if (!publication.isSubscribed) {
              await publication.setSubscribed(true);
              console.log('Subscribed to remote video track:', participant.identity, publication.source);
            }
          } catch (err) {
            console.warn('Failed to subscribe to remote video track:', err);
          }
        }
        
        updateParticipants(newRoom);
        // Check if screen share was published
        const hasScreenShare = Array.from(newRoom.localParticipant.trackPublications.values())
          .some(pub => pub.source === Track.Source.ScreenShare || pub.source === Track.Source.ScreenShareAudio);
        setIsScreenShareEnabled(hasScreenShare);
      };
      
      newRoom.on(RoomEvent.TrackPublished, handleTrackPublished);

      newRoom.on(RoomEvent.TrackUnpublished, () => {
        updateParticipants(newRoom);
        // Check if screen share was unpublished
        const hasScreenShare = Array.from(newRoom.localParticipant.trackPublications.values())
          .some(pub => pub.source === Track.Source.ScreenShare || pub.source === Track.Source.ScreenShareAudio);
        setIsScreenShareEnabled(hasScreenShare);
      });

      // Connect to room with options
      const connectOptions = {
        // Auto subscribe to all tracks (important for remote video)
        autoSubscribe: true,
        // Subscribe to all video and audio tracks
        publishDefaults: {
          videoSimulcastLayers: [],
          screenShareEncoding: {},
        },
        // Increase timeout for connection
        rtcConfig: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
        // Don't fail on connection errors, allow partial connection
        adaptiveStream: false,
      };
      
      
      // Try to connect with shorter timeout (10 seconds)
      // If it fails, we'll still allow the user to proceed
      const connectPromise = newRoom.connect(url, token, connectOptions);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );
      
      try {
        await Promise.race([connectPromise, timeoutPromise]);
        console.log('Successfully connected to room');
      } catch (connectErr: any) {
        console.warn('Connection attempt completed with warning (continuing anyway):', connectErr?.message || connectErr);
        // Still set the room even if connection has issues
        // The room might be partially connected or will reconnect
      }
      
      // Always set the room, even if connection had issues
      setRoom(newRoom);
      
      // Try to get initial participants
      try {
        updateParticipants(newRoom);
      } catch (err) {
        console.warn('Could not get initial participants:', err);
      }
      
      // Disable camera/mic by default (but don't fail if not available)
      try {
        if (newRoom.localParticipant) {
          await newRoom.localParticipant.setCameraEnabled(false);
          await newRoom.localParticipant.setMicrophoneEnabled(false);
        }
      } catch (err) {
        console.warn('Could not set camera/mic state:', err);
      }
    } catch (err: any) {
      console.error('Failed to connect to room:', err);
      setError(err.message || 'Failed to connect to room');
      setIsConnecting(false);
      throw err;
    }
  }, [updateParticipants]);

  const disconnect = useCallback(async () => {
    if (room) {
      await room.disconnect();
      setRoom(null);
      setIsConnected(false);
      setParticipants([]);
    }
  }, [room]);

  const toggleAudio = useCallback(() => {
    if (room) {
      const enabled = room.localParticipant.isMicrophoneEnabled;
      room.localParticipant.setMicrophoneEnabled(!enabled);
      setIsAudioEnabled(!enabled);
    }
  }, [room]);

  const toggleVideo = useCallback(() => {
    if (room) {
      const enabled = room.localParticipant.isCameraEnabled;
      room.localParticipant.setCameraEnabled(!enabled);
      setIsVideoEnabled(!enabled);
    }
  }, [room]);

  const toggleScreenShare = useCallback(async () => {
    if (!room || !room.localParticipant) {
      console.warn('Cannot toggle screen share: room or localParticipant not available');
      return;
    }

    console.log('Toggle screen share clicked');
    
    try {
      // Check if screen share is already active
      const isCurrentlyEnabled = room.localParticipant.isScreenShareEnabled;
      console.log('Current screen share state:', isCurrentlyEnabled);

      if (isCurrentlyEnabled) {
        // Stop screen sharing
        console.log('Stopping screen share...');
        await room.localParticipant.setScreenShareEnabled(false);
        setIsScreenShareEnabled(false);
        console.log('Screen share stopped');
      } else {
        // Start screen sharing using setScreenShareEnabled
        console.log('Starting screen share...');
        try {
          await room.localParticipant.setScreenShareEnabled(true, {
            audio: true,
            video: true,
            resolution: {
              width: 1920,
              height: 1080,
            },
          });
          
          setIsScreenShareEnabled(true);
          console.log('Screen share started successfully');

          // Listen for when screen share ends (user stops via browser UI)
          const handleTrackUnpublished = (publication: TrackPublication) => {
            if (publication.source === Track.Source.ScreenShare || publication.source === Track.Source.ScreenShareAudio) {
              console.log('Screen share track unpublished');
              setIsScreenShareEnabled(false);
              if (room) {
                room.off(RoomEvent.TrackUnpublished, handleTrackUnpublished);
              }
            }
          };
          
          room.on(RoomEvent.TrackUnpublished, handleTrackUnpublished);
        } catch (err: any) {
          console.error('Failed to start screen share:', err);
          setIsScreenShareEnabled(false);
          // User might have cancelled the share dialog - that's okay
          if (err.name === 'NotAllowedError') {
            alert('Screen sharing was denied. Please allow screen sharing in your browser settings.');
          } else if (err.name === 'AbortError') {
            console.log('Screen sharing was cancelled by user');
          } else {
            alert(`Failed to start screen sharing: ${err.message || 'Unknown error'}`);
          }
        }
      }
    } catch (err: any) {
      console.error('Error toggling screen share:', err);
      setIsScreenShareEnabled(false);
      alert(`Error: ${err.message || 'Unknown error occurred'}`);
    }
  }, [room]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  const value: LiveKitContextType = {
    room,
    participants,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    isAudioEnabled,
    isVideoEnabled,
    isScreenShareEnabled,
  };

  return <LiveKitContext.Provider value={value}>{children}</LiveKitContext.Provider>;
};

export const useLiveKit = (): LiveKitContextType => {
  const context = useContext(LiveKitContext);
  if (!context) {
    throw new Error('useLiveKit must be used within LiveKitProvider');
  }
  return context;
};


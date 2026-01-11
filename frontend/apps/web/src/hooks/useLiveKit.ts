import { useState, useEffect, useCallback, useRef } from 'react';
import { Room, RoomEvent, RemoteParticipant, LocalParticipant, ConnectionQuality, Track, LocalTrackPublication } from 'livekit-client';
import { sessionApi } from '../services/api';

// Module-level ref to share room connection across hook instances (for waiting -> active page transition)
export const sharedRoomRefs = new Map<string, { room: Room; sessionId: string }>();

interface UseLiveKitOptions {
  sessionId: string;
  participantRole: 'mentor' | 'patient';
  deviceInfo?: string; // JSON string with cameraId and microphoneId
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

interface UseLiveKitReturn {
  room: Room | null;
  participants: RemoteParticipant[];
  localParticipant: LocalParticipant | null;
  isConnected: boolean;
  isConnecting: boolean;
  isPeerConnected: boolean; // True when full WebRTC peer connection is established
  error: Error | null;
  connectionQuality: ConnectionQuality | undefined;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  toggleMute: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  screenShareTrack: any | null;
}

export const useLiveKit = (options: UseLiveKitOptions): UseLiveKitReturn => {
  const { sessionId, deviceInfo, onConnected, onDisconnected, onError } = options;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPeerConnected, setIsPeerConnected] = useState(false); // Full WebRTC peer connection
  const [error, setError] = useState<Error | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareTrack, setScreenShareTrack] = useState<any | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality | undefined>(undefined);
  
  const roomRef = useRef<Room | null>(null);
  const connectingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const signalConnectedRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const maxRetries = 3;
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParticipants = useCallback((currentRoom: Room) => {
    const remoteParticipants = Array.from(currentRoom.remoteParticipants.values());
    console.log('[useLiveKit] Updating participants:', {
      remoteCount: remoteParticipants.length,
      localParticipant: currentRoom.localParticipant?.identity || 'none',
      localParticipantName: currentRoom.localParticipant?.name || 'none',
      remoteIdentities: remoteParticipants.map(p => p.identity),
      remoteNames: remoteParticipants.map(p => p.name || 'unknown'),
      roomState: currentRoom.state,
      roomName: currentRoom.name,
      totalParticipants: remoteParticipants.length + (currentRoom.localParticipant ? 1 : 0)
    });
    setParticipants(remoteParticipants);
    setLocalParticipant(currentRoom.localParticipant);
  }, []);

  // Setup event listeners for room (used both for new rooms and reused rooms)
  const setupRoomEventListeners = useCallback((roomToSetup: Room, isReuse: boolean = false) => {
    // CRITICAL: When reusing a room, remove all old listeners first to avoid duplicates
    // and ensure we use the correct callbacks from the current component instance
    if (isReuse) {
      console.log('[useLiveKit] Removing old event listeners from reused room to avoid duplicates');
      roomToSetup.removeAllListeners();
      // CRITICAL: After removing listeners, immediately refresh participants list
      // This ensures we see any participants who joined before we set up listeners
      setTimeout(() => {
        updateParticipants(roomToSetup);
        console.log('[useLiveKit] Refreshed participants after removing old listeners');
      }, 100);
    }

    // Signal connected event
    roomToSetup.on(RoomEvent.SignalConnected, () => {
      signalConnectedRef.current = true;
      console.log('[useLiveKit] Signal connection established (WebSocket connected)', {
        roomState: roomToSetup.state,
        roomName: roomToSetup.name,
        sessionId,
        localParticipantIdentity: roomToSetup.localParticipant?.identity,
        localParticipantName: roomToSetup.localParticipant?.name,
        remoteParticipantsCount: roomToSetup.remoteParticipants.size,
        allParticipantIdentities: Array.from(roomToSetup.remoteParticipants.values()).map(p => p.identity)
      });
      setIsConnected((prev) => {
        if (!prev) {
          console.log('[useLiveKit] Setting isConnected=true from SignalConnected event');
          setIsConnecting(false);
          updateParticipants(roomToSetup);
          onConnected?.();
          return true;
        }
        return prev;
      });
    });

    // Full connection event
    roomToSetup.on(RoomEvent.Connected, async () => {
      const remoteCount = roomToSetup.remoteParticipants.size;
      const totalParticipants = remoteCount + (roomToSetup.localParticipant ? 1 : 0);
      
      console.log('[useLiveKit] ✓✓✓ FULL CONNECTION ESTABLISHED (signal + peer) - Ready for video/audio! ✓✓✓', {
        roomName: roomToSetup.name,
        sessionId,
        localParticipantIdentity: roomToSetup.localParticipant?.identity,
        localParticipantName: roomToSetup.localParticipant?.name,
        remoteParticipantsCount: remoteCount,
        totalParticipants,
        roomState: roomToSetup.state
      });
      
      setIsConnected(true);
      setIsPeerConnected(true);
      setIsConnecting(false);
      signalConnectedRef.current = true;
      updateParticipants(roomToSetup);
      onConnected?.();
      
      // CRITICAL: Enable camera and microphone when peer connection is established (for reused rooms)
      if (roomToSetup.localParticipant && totalParticipants >= 2) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasVideo = devices.some(device => device.kind === 'videoinput');
          const hasAudio = devices.some(device => device.kind === 'audioinput');
          
          if (hasVideo) {
            try {
              await roomToSetup.localParticipant.setCameraEnabled(true);
              console.log('[useLiveKit] ✓ Camera enabled after peer connection (reused room)');
              setIsVideoEnabled(true);
            } catch (videoErr: any) {
              console.warn('[useLiveKit] Could not enable camera:', videoErr.message);
            }
          }
          
          if (hasAudio) {
            try {
              await roomToSetup.localParticipant.setMicrophoneEnabled(true);
              console.log('[useLiveKit] ✓ Microphone enabled after peer connection (reused room)');
              setIsMuted(false);
            } catch (audioErr: any) {
              console.warn('[useLiveKit] Could not enable microphone:', audioErr.message);
            }
          }
          
          setTimeout(() => {
            updateParticipants(roomToSetup);
          }, 500);
        } catch (err: any) {
          console.warn('[useLiveKit] Error enabling camera/microphone (reused room):', err.message);
        }
      }
    });

    // Disconnected event
    roomToSetup.on(RoomEvent.Disconnected, (reason?: string | number) => {
      const reasonStr = typeof reason === 'string' ? reason : String(reason || '');
      console.log('[useLiveKit] Disconnected from room', { reason, reasonStr, roomState: roomToSetup.state });
      setIsConnected(false);
      setIsPeerConnected(false);
      setIsConnecting(false);
      updateParticipants(roomToSetup);
      
      if (reasonStr && reasonStr.includes('Client initiated')) {
        onDisconnected?.();
      } else {
        console.log('[useLiveKit] Unexpected disconnect, LiveKit will attempt auto-reconnect');
      }
    });

    // CRITICAL: Participant connected/disconnected events - these update the participants list
    roomToSetup.on(RoomEvent.ParticipantConnected, (participant) => {
      const remoteCount = roomToSetup.remoteParticipants.size;
      const totalParticipants = remoteCount + (roomToSetup.localParticipant ? 1 : 0);
      console.log('[useLiveKit] ✓ Participant connected (reused room):', {
        identity: participant.identity,
        name: participant.name,
        sid: participant.sid,
        remoteParticipantsCount: remoteCount,
        totalParticipants,
        roomState: roomToSetup.state,
        roomName: roomToSetup.name
      });
      // CRITICAL: Always update participants when someone joins
      updateParticipants(roomToSetup);
      
      // Log if we now have 2+ participants (ready for mentor to start)
      if (totalParticipants >= 2) {
        console.log('[useLiveKit] ✓✓✓ Both participants connected (reused room) - Waiting room ready! ✓✓✓');
      }
    });

    roomToSetup.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log('[useLiveKit] Participant disconnected:', participant.identity, participant.name);
      updateParticipants(roomToSetup);
    });

    // Reconnecting events
    roomToSetup.on(RoomEvent.Reconnecting, () => {
      console.log('[useLiveKit] Room reconnecting...');
      setIsConnecting(true);
    });

    roomToSetup.on(RoomEvent.Reconnected, () => {
      console.log('[useLiveKit] Room reconnected');
      setIsConnected(true);
      setIsConnecting(false);
      updateParticipants(roomToSetup);
    });

    // Connection quality
    roomToSetup.on(RoomEvent.ConnectionQualityChanged, () => {
      if (roomToSetup.localParticipant) {
        setConnectionQuality(roomToSetup.localParticipant.connectionQuality);
      }
    });
  }, [sessionId, onConnected, onDisconnected, updateParticipants]);

  const connect = useCallback(async () => {
    console.log('[useLiveKit] connect() called', { sessionId, isConnecting, isConnected, connectingRef: connectingRef.current, retryCount: retryCountRef.current });
    
    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    // Clear error state when attempting new connection
    setError(null);
    
    // Use ref to prevent race conditions - check and set atomically
    if (connectingRef.current || isConnecting) {
      // Allow reconnection if already connected but room is disconnected
      if (isConnected && roomRef.current?.state === 'disconnected') {
        console.log('[useLiveKit] Room disconnected, allowing reconnection...');
      } else {
        console.log('[useLiveKit] Connection already in progress, skipping...');
        return;
      }
    }

    // Check if component is still mounted
    if (!isMountedRef.current) {
      console.log('Component unmounted, aborting connection...');
      return;
    }

    // CRITICAL: Check if there's already a connected room for this sessionId (from waiting page)
    // This allows reusing the room connection when navigating from waiting to active page
    const existingSharedRoom = sharedRoomRefs.get(sessionId);
    if (existingSharedRoom) {
      const roomState = existingSharedRoom.room.state;
      console.log('[useLiveKit] Found existing room in sharedRoomRefs:', {
        sessionId,
        roomName: existingSharedRoom.room.name,
        roomState,
        currentRemoteParticipants: existingSharedRoom.room.remoteParticipants.size,
        localParticipant: existingSharedRoom.room.localParticipant?.identity || 'none'
      });
      
      // CRITICAL: Only reuse if room is connected or reconnecting
      // If disconnected, we need to create a new room connection
      if (roomState === 'connected' || roomState === 'reconnecting') {
        console.log('[useLiveKit] ✓ Reusing existing room connection from waiting page');
        roomRef.current = existingSharedRoom.room;
        setRoom(existingSharedRoom.room);
        
        // Check if room is fully connected (signal + peer)
        const isFullyConnected = roomState === 'connected';
        
        if (isFullyConnected) {
          setIsConnected(true);
          setIsPeerConnected(true);
          setIsConnecting(false);
          console.log('[useLiveKit] ✓ Room is fully connected (signal + peer) - ready for video call');
        } else {
          setIsConnected(true);
          setIsPeerConnected(false); // Peer connection not yet established
          setIsConnecting(false);
          console.log('[useLiveKit] ✓ Room has signal connection, waiting for peer connection...');
        }
        
        // CRITICAL: Setup event listeners again to ensure we receive ParticipantConnected events
        setupRoomEventListeners(existingSharedRoom.room, true);
        updateParticipants(existingSharedRoom.room);
        // Room is already connected, no need to connect again
        return;
      } else {
        // Room is disconnected - remove from shared refs and create new connection
        console.log('[useLiveKit] ⚠ Existing room is disconnected, creating new connection');
        sharedRoomRefs.delete(sessionId);
        // Continue to create new room below
      }
    }

    // Clean up any existing room before creating a new one (only if it's a different sessionId)
    if (roomRef.current) {
      const currentRoomSessionId = roomRef.current.name?.replace('session-', '') || '';
      if (currentRoomSessionId !== sessionId) {
        console.log('[useLiveKit] Cleaning up existing room (different sessionId)...');
        try {
          roomRef.current.disconnect();
          roomRef.current.removeAllListeners();
        } catch (err) {
          console.warn('Error cleaning up existing room:', err);
        }
        roomRef.current = null;
        setRoom(null);
      } else {
        // Same sessionId, check if room is still connected
        if (roomRef.current.state === 'connected' || roomRef.current.state === 'reconnecting') {
          console.log('[useLiveKit] Room already connected for this sessionId, reusing...');
          setIsConnected(true);
          setIsConnecting(false);
          updateParticipants(roomRef.current);
          return;
        }
      }
    }

    // Cancel any previous connection attempt
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this connection
    abortControllerRef.current = new AbortController();
    const abortSignal = abortControllerRef.current.signal;

    connectingRef.current = true;

    // Request camera/microphone permissions before connecting (optional, won't fail if denied)
    // Only request if devices are available
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideo = devices.some(device => device.kind === 'videoinput');
      const hasAudio = devices.some(device => device.kind === 'audioinput');
      
      if (hasVideo || hasAudio) {
        try {
          await navigator.mediaDevices.getUserMedia({ 
            video: hasVideo ? true : false, 
            audio: hasAudio ? true : false 
          });
          console.log('Camera and microphone permissions granted');
        } catch (permErr: any) {
          // Ignore permission errors - connection can still work
          if (permErr.name !== 'NotFoundError') {
            console.warn('Camera/microphone permissions not granted, continuing anyway:', permErr);
          }
        }
      } else {
        console.log('No camera/microphone devices found, continuing without media');
      }
    } catch (enumErr) {
      console.warn('Could not enumerate devices, continuing anyway:', enumErr);
      // Continue even if device enumeration fails
    }

    try {
      setIsConnecting(true);
      setError(null);

      console.log('[useLiveKit] Requesting join token for sessionId:', sessionId);

      // Get join token from API (with device info if provided)
      const joinResponse = await sessionApi.getJoinToken(sessionId, deviceInfo);
      const { 
        join_token: token, 
        technical_config,
        session_metadata 
      } = joinResponse;

      // Get LiveKit URL and room ID from API response
      // Backend returns url in technical_config.livekit_url or session_metadata.url
      const wsUrl = technical_config?.livekit_url || 
                    technical_config?.url ||
                    session_metadata?.url ||
                    (import.meta.env.VITE_LIVEKIT_URL as string) || 
                    'ws://localhost:7880';
      const roomName = technical_config?.room_id || 
                       technical_config?.room_name ||
                       session_metadata?.room_id || 
                       session_metadata?.room_name ||
                       sessionId; // Fallback to session ID

      console.log('[useLiveKit] ✓ Join token received:', { wsUrl, roomName, sessionId, hasToken: !!token });

      // Create room with RTC configuration
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 1280, height: 720 },
        },
      });

      // Set up event listeners
      // Listen for signal connection (WebSocket) - this happens first
      signalConnectedRef.current = false;
      newRoom.on(RoomEvent.SignalConnected, () => {
        signalConnectedRef.current = true;
        const remoteCount = newRoom.remoteParticipants.size;
        console.log('[useLiveKit] Signal connection established (WebSocket connected)', {
          roomState: newRoom.state,
          roomName: newRoom.name,
          sessionId,
          localParticipantIdentity: newRoom.localParticipant?.identity,
          localParticipantName: newRoom.localParticipant?.name,
          remoteParticipantsCount: remoteCount,
          totalParticipants: remoteCount + (newRoom.localParticipant ? 1 : 0),
          allParticipantIdentities: Array.from(newRoom.remoteParticipants.values()).map(p => p.identity)
        });
        // For waiting room, signal connection is enough
        // Peer connection will establish when second participant joins
        // Use functional update to ensure we get latest state
        setIsConnected((prev) => {
          if (!prev) {
            console.log('[useLiveKit] Setting isConnected=true from SignalConnected event');
            setIsConnecting(false);
            // Set room reference first
            roomRef.current = newRoom;
            setRoom(newRoom);
            // Store in shared refs for reuse when navigating to active page
            sharedRoomRefs.set(sessionId, { room: newRoom, sessionId });
            // CRITICAL: Update participants immediately
            // This ensures we see participants who joined before we connected
            updateParticipants(newRoom);
            
            // CRITICAL: Set up periodic refresh to catch participants who join after we connect
            // This is a safety net in case ParticipantConnected event is missed
            // Store interval in room metadata so we can clear it later
            const refreshIntervalId = setInterval(() => {
              if (newRoom.state !== 'disconnected' && isMountedRef.current && roomRef.current === newRoom) {
                const currentRemoteCount = newRoom.remoteParticipants.size;
                const hasLocalParticipant = !!newRoom.localParticipant;
                const currentTotal = currentRemoteCount + (hasLocalParticipant ? 1 : 0);
                
                // Always update participants (this triggers re-render)
                updateParticipants(newRoom);
                
                // Only log if we actually have 2+ participants (avoid false positives)
                if (currentTotal >= 2 && currentRemoteCount >= 1) {
                  console.log('[useLiveKit] Periodic refresh detected 2+ participants', {
                    remoteCount: currentRemoteCount,
                    hasLocal: hasLocalParticipant,
                    total: currentTotal
                  });
                }
              } else {
                clearInterval(refreshIntervalId);
                delete (newRoom as any)._refreshIntervalId;
              }
            }, 2000); // Refresh every 2 seconds
            
            // Store interval ID for cleanup
            (newRoom as any)._refreshIntervalId = refreshIntervalId;
            
            // Clear interval when room disconnects
            const disconnectHandler = () => {
              if ((newRoom as any)._refreshIntervalId) {
                clearInterval((newRoom as any)._refreshIntervalId);
                delete (newRoom as any)._refreshIntervalId;
              }
            };
            newRoom.on(RoomEvent.Disconnected, disconnectHandler);
            
            // Also refresh participants after short delays to catch timing issues
            setTimeout(() => {
              updateParticipants(newRoom);
              console.log('[useLiveKit] Refreshed participants after SignalConnected delay (500ms)');
            }, 500);
            setTimeout(() => {
              updateParticipants(newRoom);
              console.log('[useLiveKit] Refreshed participants after SignalConnected delay (1500ms)');
            }, 1500);
            
            onConnected?.();
            return true;
          } else {
            // Already connected but signal reconnected - refresh participants
            updateParticipants(newRoom);
          }
          return prev;
        });
      });

      // Listen for full connection (signal + peer)
      // This is the CRITICAL event for active video call - ensures WebRTC peer connection is established
      newRoom.on(RoomEvent.Connected, async () => {
        const remoteCount = newRoom.remoteParticipants.size;
        const totalParticipants = remoteCount + (newRoom.localParticipant ? 1 : 0);
        
        console.log('[useLiveKit] ✓✓✓ FULL CONNECTION ESTABLISHED (signal + peer) - Ready for video/audio! ✓✓✓', {
          roomName: newRoom.name,
          sessionId,
          localParticipantIdentity: newRoom.localParticipant?.identity,
          localParticipantName: newRoom.localParticipant?.name,
          remoteParticipantsCount: remoteCount,
          totalParticipants,
          roomState: newRoom.state,
          hasLocalParticipant: !!newRoom.localParticipant
        });
        
        setIsConnected(true);
        setIsPeerConnected(true); // Mark peer connection as established - CRITICAL for active page!
        setIsConnecting(false);
        signalConnectedRef.current = true;
        updateParticipants(newRoom);
        onConnected?.();
        
        // CRITICAL: Enable camera and microphone when peer connection is established
        // This ensures both participants can see each other in video call
        if (newRoom.localParticipant && totalParticipants >= 2) {
          try {
            // Check for available devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasVideo = devices.some(device => device.kind === 'videoinput');
            const hasAudio = devices.some(device => device.kind === 'audioinput');
            
            // Enable camera if available
            if (hasVideo) {
              try {
                await newRoom.localParticipant.setCameraEnabled(true);
                console.log('[useLiveKit] ✓ Camera enabled after peer connection');
                setIsVideoEnabled(true);
              } catch (videoErr: any) {
                console.warn('[useLiveKit] Could not enable camera:', videoErr.message);
              }
            } else {
              console.log('[useLiveKit] No camera device found');
            }
            
            // Enable microphone if available
            if (hasAudio) {
              try {
                await newRoom.localParticipant.setMicrophoneEnabled(true);
                console.log('[useLiveKit] ✓ Microphone enabled after peer connection');
                setIsMuted(false);
              } catch (audioErr: any) {
                console.warn('[useLiveKit] Could not enable microphone:', audioErr.message);
              }
            } else {
              console.log('[useLiveKit] No microphone device found');
            }
            
            // Update participants after enabling media to refresh video tracks
            setTimeout(() => {
              updateParticipants(newRoom);
            }, 500);
          } catch (err: any) {
            console.warn('[useLiveKit] Error enabling camera/microphone:', err.message);
            // Continue - user can enable manually
          }
        }
        
        // Log if we have 2+ participants (ready for video call)
        if (totalParticipants >= 2) {
          console.log('[useLiveKit] ✓ Both participants connected - Video call ready!');
        } else {
          console.log('[useLiveKit] ⚠ Only 1 participant - Waiting for second participant...');
        }
      });

      newRoom.on(RoomEvent.Disconnected, (reason?: string | number) => {
        const reasonStr = typeof reason === 'string' ? reason : String(reason || '');
        console.log('[useLiveKit] Disconnected from room', { reason, reasonStr, roomState: newRoom.state });
        setIsConnected(false);
        setIsPeerConnected(false); // Peer connection lost
        setIsConnecting(false);
        updateParticipants(newRoom);
        
        // CRITICAL: Handle leave-reconnect errors - these indicate ICE/NAT failure
        // In this case, we should NOT auto-reconnect as it will fail again
        // Instead, we'll let the user manually reconnect or wait for better network conditions
        if (reasonStr && (reasonStr.includes('leave-reconnect') || reasonStr.includes('Received leave request'))) {
          console.warn('[useLiveKit] ⚠ Leave-reconnect error detected - ICE/NAT traversal failure');
          console.warn('[useLiveKit] This usually means the LiveKit server cannot establish peer connection');
          console.warn('[useLiveKit] Possible causes: Firewall blocking, incorrect NAT config, or network issues');
          // Don't auto-reconnect for leave-reconnect errors - they will fail again
          // Set error state so UI can show appropriate message
          setError(new Error('Connection failed due to network configuration. Please check your network settings and try again.'));
          // Remove from shared refs since this connection is broken
          sharedRoomRefs.delete(sessionId);
          onDisconnected?.();
          return;
        }
        
        // Only call onDisconnected if it's a manual disconnect or max retries reached
        // Auto-reconnect will be handled by LiveKit's built-in reconnection
        // We just need to handle the case where reconnection fails
        if (reasonStr && reasonStr.includes('Client initiated')) {
          // Manual disconnect - don't auto-reconnect
          onDisconnected?.();
        } else {
          // Unexpected disconnect - LiveKit will try to reconnect automatically
          // We'll handle reconnection failure in the error handler
          console.log('[useLiveKit] Unexpected disconnect, LiveKit will attempt auto-reconnect');
        }
      });

      newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        const remoteCount = newRoom.remoteParticipants.size;
        const totalParticipants = remoteCount + (newRoom.localParticipant ? 1 : 0);
        console.log('[useLiveKit] ✓ Participant connected:', {
          identity: participant.identity,
          name: participant.name,
          sid: participant.sid,
          remoteParticipantsCount: remoteCount,
          totalParticipants,
          roomState: newRoom.state,
          roomName: newRoom.name
        });
        // CRITICAL: Always update participants when someone joins
        // This ensures both participants see each other in waiting room
        updateParticipants(newRoom);
        
        // Log if we now have 2+ participants (ready for mentor to start)
        if (totalParticipants >= 2) {
          console.log('[useLiveKit] ✓✓✓ Both participants connected - Waiting room ready! ✓✓✓');
        }
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('[useLiveKit] Participant disconnected:', participant.identity, participant.name);
        updateParticipants(newRoom);
      });
      
      // Listen for reconnecting state
      newRoom.on(RoomEvent.Reconnecting, () => {
        console.log('[useLiveKit] Room reconnecting...');
        setIsConnecting(true);
        // Don't set isConnected to false - keep it true during reconnection
      });
      
      // Listen for reconnected state
      newRoom.on(RoomEvent.Reconnected, () => {
        console.log('[useLiveKit] Room reconnected successfully');
        setIsConnected(true);
        setIsPeerConnected(true); // Peer connection re-established
        setIsConnecting(false);
        retryCountRef.current = 0; // Reset retry count on successful reconnect
        updateParticipants(newRoom);
        onConnected?.();
      });

      // CRITICAL: Track subscription events - these update video tracks when remote participants publish
      newRoom.on(RoomEvent.TrackSubscribed, (track: any, _publication: any, participant: any) => {
        console.log('[useLiveKit] Track subscribed:', {
          trackKind: track?.kind,
          trackSid: track?.sid,
          participantIdentity: participant?.identity,
          participantName: participant?.name,
          isVideo: track?.kind === 'video',
          isAudio: track?.kind === 'audio'
        });
        // Update participants to refresh video tracks in UI
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, (track: any, _publication: any, participant: any) => {
        console.log('[useLiveKit] Track unsubscribed:', {
          trackKind: track?.kind,
          participantIdentity: participant?.identity
        });
        updateParticipants(newRoom);
      });

      // CRITICAL: Local track published - when we publish our own video/audio/screen
      newRoom.on(RoomEvent.LocalTrackPublished, (publication: LocalTrackPublication) => {
        console.log('[useLiveKit] Local track published:', {
          trackName: publication?.trackName,
          trackSid: publication?.trackSid,
          source: publication?.source,
          kind: publication?.kind,
          isScreenShare: publication?.source === Track.Source.ScreenShare
        });
        
        // Update screen share state if this is a screen share track
        if (publication?.source === Track.Source.ScreenShare && publication?.track) {
          console.log('[useLiveKit] ✓ Screen share track published, updating state');
          setIsScreenSharing(true);
          setScreenShareTrack(publication.track);
          
          // Listen for track ended
          publication.track.on('ended', () => {
            console.log('[useLiveKit] Screen share track ended via event');
            setIsScreenSharing(false);
            setScreenShareTrack(null);
          });
        }
        
        updateParticipants(newRoom);
        setIsVideoEnabled(newRoom.localParticipant.isCameraEnabled);
        setIsMuted(newRoom.localParticipant.isMicrophoneEnabled === false);
      });

      newRoom.on(RoomEvent.LocalTrackUnpublished, (publication: LocalTrackPublication) => {
        console.log('[useLiveKit] Local track unpublished:', {
          trackName: publication?.trackName,
          source: publication?.source,
          kind: publication?.kind
        });
        
        // Update screen share state if screen share was unpublished
        if (publication?.source === Track.Source.ScreenShare) {
          console.log('[useLiveKit] Screen share track unpublished');
          setIsScreenSharing(false);
          setScreenShareTrack(null);
        }
        
        updateParticipants(newRoom);
      });
      
      // CRITICAL: Remote track published - when remote participant publishes video/audio/screen
      newRoom.on(RoomEvent.TrackPublished, (publication: any, participant: any) => {
        const isScreenShare = publication?.source === Track.Source.ScreenShare;
        console.log('[useLiveKit] Remote track published:', {
          trackName: publication?.trackName,
          source: publication?.source,
          kind: publication?.kind,
          participantIdentity: participant?.identity,
          participantName: participant?.name,
          isScreenShare
        });
        
        if (isScreenShare) {
          console.log('[useLiveKit] ✓ Remote participant started screen sharing:', participant?.name);
        }
        
        // Update participants to refresh video tracks
        updateParticipants(newRoom);
      });
      
      newRoom.on(RoomEvent.TrackUnpublished, (publication: any, participant: any) => {
        const isScreenShare = publication?.source === Track.Source.ScreenShare;
        console.log('[useLiveKit] Remote track unpublished:', {
          trackName: publication?.trackName,
          source: publication?.source,
          kind: publication?.kind,
          participantIdentity: participant?.identity,
          isScreenShare
        });
        
        if (isScreenShare) {
          console.log('[useLiveKit] Remote participant stopped screen sharing:', participant?.name);
        }
        
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.TrackMuted, () => {
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.TrackUnmuted, () => {
        updateParticipants(newRoom);
      });

      // Monitor connection quality
      newRoom.on(RoomEvent.ConnectionQualityChanged, () => {
        if (newRoom.localParticipant) {
          setConnectionQuality(newRoom.localParticipant.connectionQuality);
        }
      });

      // Connect to room using URL from API
      // Note: Room name is typically embedded in the JWT token
      // But we can also specify it explicitly if needed
      console.log('[useLiveKit] ========================================');
      console.log('[useLiveKit] CONNECTING TO LIVEKIT ROOM');
      console.log('[useLiveKit] SessionId:', sessionId);
      console.log('[useLiveKit] Room Name:', roomName);
      console.log('[useLiveKit] WebSocket URL:', wsUrl);
      console.log('[useLiveKit] Has Token:', !!token);
      console.log('[useLiveKit] Token Length:', token?.length || 0);
      console.log('[useLiveKit] Participant Role:', options.participantRole);
      console.log('[useLiveKit] ========================================');
      
      // Small delay to ensure component is fully mounted (helps with React Strict Mode)
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if aborted after delay
      if (abortSignal.aborted || !isMountedRef.current) {
        console.log('Connection aborted before connect');
        try {
          newRoom.disconnect();
          newRoom.removeAllListeners();
        } catch (cleanupErr) {
          // Ignore cleanup errors
        }
        connectingRef.current = false;
        return;
      }
      
      // Set room ref before connecting to prevent race conditions
      roomRef.current = newRoom;
      setRoom(newRoom);
      // Store in shared refs for reuse when navigating to active page
      sharedRoomRefs.set(sessionId, { room: newRoom, sessionId });
      
      // Connect with abort signal handling and timeout
      // Connect with timeout
      // For local development, no need for STUN/TURN servers as we're on localhost
      const connectTimeout = 30000; // 30 seconds timeout
      const connectPromise = Promise.race([
        newRoom.connect(wsUrl, token),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), connectTimeout);
        }),
      ]);
      
      // Race between connection and abort
      const abortPromise = new Promise<never>((_, reject) => {
        if (abortSignal.aborted) {
          reject(new Error('Connection aborted'));
          return;
        }
        abortSignal.addEventListener('abort', () => {
          reject(new Error('Connection aborted'));
        });
      });
      
      try {
        await Promise.race([connectPromise, abortPromise]);
        // If we get here, connection succeeded fully
        console.log('Full connection established (signal + peer)');
      } catch (raceErr: any) {
        // If aborted, cleanup and return silently
        if (raceErr?.message === 'Connection aborted' || abortSignal.aborted || !isMountedRef.current) {
          console.log('Connection aborted during connect');
          try {
            newRoom.disconnect();
            newRoom.removeAllListeners();
          } catch (cleanupErr) {
            console.warn('Error cleaning up aborted connection:', cleanupErr);
          }
          roomRef.current = null;
          setRoom(null);
          connectingRef.current = false;
          return;
        }
        
        // Check if signal connection succeeded even though peer connection failed
        // This can happen when only 1 participant is in the room (WebRTC needs 2 participants)
        // Wait a bit to see if signal connection event fires
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check multiple indicators of signal connection success
        const hasSignalConnection = signalConnectedRef.current || 
                                   newRoom.state === 'connected' || 
                                   newRoom.state === 'reconnecting';
        
        if (hasSignalConnection) {
          console.log('Signal connection established, peer connection will establish when second participant joins');
          setIsConnected(true);
          setIsConnecting(false);
          updateParticipants(newRoom);
          onConnected?.();
          connectingRef.current = false;
          // Don't throw error - signal connection is enough for waiting room
          return;
        }
        
        // If error is specifically about peer connection, check room state one more time
        if (raceErr?.message?.includes('pc connection') || 
            raceErr?.message?.includes('peer connection') || 
            raceErr?.message?.includes('could not establish')) {
          console.warn('Peer connection failed, checking if signal connection exists...');
          // Check room state - if it's not disconnected, signal connection may be OK
          const roomState = newRoom.state;
          if (roomState && roomState !== 'disconnected') {
            console.log(`Room state: ${roomState}, allowing connection (signal level OK)`);
            setIsConnected(true);
            setIsConnecting(false);
            updateParticipants(newRoom);
            onConnected?.();
            connectingRef.current = false;
            // Don't throw error - signal connection is enough
            return;
          }
        }
        
        // Only throw if we truly failed to connect at signal level
        console.error('Failed to establish signal connection:', raceErr);
        throw raceErr;
      }
      
      // Check if aborted after connecting
      if (abortSignal.aborted || !isMountedRef.current) {
        console.log('Connection aborted after connect');
        try {
          newRoom.disconnect();
          newRoom.removeAllListeners();
        } catch (cleanupErr) {
          console.warn('Error cleaning up aborted connection:', cleanupErr);
        }
        roomRef.current = null;
        setRoom(null);
        connectingRef.current = false;
        return;
      }
      
      // Set initial connection quality
      if (newRoom.localParticipant) {
        setConnectionQuality(newRoom.localParticipant.connectionQuality);
      }

      // Update participants after connection
      updateParticipants(newRoom);
      
      // Reset retry count on successful connection
      retryCountRef.current = 0;
      
      // Don't automatically publish tracks - let the active page handle that
      // This allows waiting room to connect without camera/mic
      
      connectingRef.current = false;
    } catch (err: any) {
      // Ignore "Client initiated disconnect" errors (expected in React Strict Mode)
      const isClientDisconnect = err?.message?.includes('Client initiated disconnect') || 
                                 err?.message?.includes('cancelled') ||
                                 err?.name === 'AbortError';
      
      if (isClientDisconnect) {
        console.log('Connection cancelled (likely due to React Strict Mode):', err.message);
        connectingRef.current = false;
        const currentRoom = roomRef.current;
        if (currentRoom) {
          try {
            currentRoom.disconnect();
            currentRoom.removeAllListeners();
          } catch (cleanupErr) {
            // Ignore cleanup errors for cancelled connections
          }
          roomRef.current = null;
          setRoom(null);
        }
        // Don't set error or call onError for expected disconnects
        return;
      }
      
      console.error('LiveKit connection error:', err);
      
      // Clean up on error
      connectingRef.current = false;
      const currentRoom = roomRef.current;
      if (currentRoom) {
        try {
          currentRoom.disconnect();
          currentRoom.removeAllListeners();
        } catch (cleanupErr) {
          console.warn('Error cleaning up room on connection failure:', cleanupErr);
        }
        roomRef.current = null;
        setRoom(null);
      }
      
      // Check if signal connection was established before throwing error
      // Wait a moment to see if signal connection event fired
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (signalConnectedRef.current || roomRef.current?.state === 'connected' || roomRef.current?.state === 'reconnecting') {
        console.log('Signal connection exists despite error, connection is OK for waiting room');
        setIsConnected(true);
        setIsConnecting(false);
        updateParticipants(roomRef.current!);
        onConnected?.();
        connectingRef.current = false;
        // Don't set error or call onError - connection is OK
        return;
      }
      
      // Only set error if component is still mounted
      if (!isMountedRef.current) {
        return;
      }
      
      let errorMessage = 'Failed to connect to session room. ';
      
      // Provide more specific error messages
      if (err?.message) {
        // Check if LiveKit server is not running
        if (err.message.includes('Failed to fetch') || 
            err.message.includes('ERR_CONNECTION_REFUSED') ||
            err.message.includes('could not establish signal connection') ||
            err.message.includes('serverUnreachable')) {
          errorMessage = 'Cannot connect to LiveKit server. ';
          errorMessage += 'The LiveKit server is not running or not reachable. ';
          errorMessage += 'Please ensure: 1) Docker Desktop is running, 2) LiveKit server is started (run: docker start livekit-server or .\\start-livekit.ps1), 3) Server is accessible on ws://localhost:7880';
        } else if (err.message.includes('could not establish pc connection') || err.message.includes('pc connection')) {
          errorMessage += 'WebRTC peer connection failed. ';
          errorMessage += 'This may be due to: network restrictions, firewall blocking UDP ports, or browser WebRTC limitations. ';
          errorMessage += 'Please check: 1) Firewall allows ports 7880-7882, 2) Network allows UDP traffic, 3) Browser supports WebRTC.';
        } else if (err.message.includes('timeout')) {
          errorMessage += 'Connection timed out. The LiveKit server may be unreachable or network is slow. Please check your connection and try again.';
        } else if (err.message.includes('WebSocket') || err.message.includes('ws://') || err.message.includes('wss://')) {
          errorMessage += 'Cannot connect to LiveKit server. Please check if the server is running on ws://localhost:7880 and accessible.';
        } else if (err.message.includes('token') || err.message.includes('authentication') || err.message.includes('unauthorized')) {
          errorMessage += 'Invalid authentication token. Please try refreshing the page or logging in again.';
        } else if (err.message.includes('network') || err.message.includes('connection') || err.message.includes('fetch')) {
          errorMessage += 'Network connection error. Please check your internet connection and firewall settings.';
        } else {
          errorMessage += err.message;
        }
      } else {
        errorMessage += 'Please check your network connection, firewall settings, and try again.';
      }
      
      const error = err instanceof Error ? new Error(errorMessage) : new Error(errorMessage);
      
      // Auto-retry logic (only if not aborted and component still mounted)
      if (isMountedRef.current && !abortSignal.aborted && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 5000); // Exponential backoff, max 5s
        
        console.log(`[useLiveKit] Connection failed, retrying in ${retryDelay}ms (attempt ${retryCountRef.current}/${maxRetries})...`);
        
        // Clear error state temporarily during retry
        setError(null);
        setIsConnecting(true);
        
        retryTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && !abortSignal.aborted) {
            console.log(`[useLiveKit] Retrying connection (attempt ${retryCountRef.current}/${maxRetries})...`);
            connect(); // Retry connection
          }
        }, retryDelay);
        
        // Don't set error yet - wait for all retries to fail
        return;
      }
      
      // All retries exhausted or max retries reached
      if (retryCountRef.current >= maxRetries) {
        console.error(`[useLiveKit] All ${maxRetries} retry attempts exhausted`);
        retryCountRef.current = 0; // Reset for next manual retry
      }
      
      setError(error);
      setIsConnecting(false);
      setIsConnected(false);
      onError?.(error);
      // Don't re-throw - let the component handle the error state
    }
  }, [sessionId, deviceInfo, isConnecting, isConnected, onConnected, onDisconnected, onError, updateParticipants]);

  const disconnect = useCallback(async () => {
    // CRITICAL: Log participant leave to database before disconnecting (no cache - everything in DB)
    if (sessionId && sessionId !== 'default-session' && roomRef.current) {
      try {
        const { sessionApi } = await import('../services/api');
        await sessionApi.logParticipantLeave(sessionId);
      } catch (err) {
        console.warn('[useLiveKit] Error logging participant leave:', err);
        // Don't block disconnect if logging fails
      }
    }

    // Clear any retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    // Abort any ongoing connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Reset retry count
    retryCountRef.current = 0;
    
    connectingRef.current = false;
    if (roomRef.current) {
      try {
        // CRITICAL: Clear any periodic refresh intervals before disconnecting
        if ((roomRef.current as any)._refreshIntervalId) {
          clearInterval((roomRef.current as any)._refreshIntervalId);
          delete (roomRef.current as any)._refreshIntervalId;
          console.log('[useLiveKit] Cleared periodic refresh interval on disconnect');
        }
        roomRef.current.disconnect();
        roomRef.current.removeAllListeners();
      } catch (err) {
        console.warn('Error disconnecting room:', err);
      }
      // Cleanup shared room ref for this sessionId
      sharedRoomRefs.delete(sessionId);
      roomRef.current = null;
      setRoom(null);
      setParticipants([]);
      setLocalParticipant(null);
      setIsConnected(false);
      setIsPeerConnected(false);
      setIsConnecting(false);
      setIsMuted(true);
      setIsVideoEnabled(false);
    }
  }, []);

  const toggleMute = useCallback(async () => {
    if (!roomRef.current) return;

    const micEnabled = roomRef.current.localParticipant.isMicrophoneEnabled;
    if (micEnabled) {
      await roomRef.current.localParticipant.setMicrophoneEnabled(false);
      setIsMuted(true);
    } else {
      await roomRef.current.localParticipant.setMicrophoneEnabled(true);
      setIsMuted(false);
    }
  }, []);

  const toggleVideo = useCallback(async () => {
    if (!roomRef.current) return;

    const cameraEnabled = roomRef.current.localParticipant.isCameraEnabled;
    if (cameraEnabled) {
      await roomRef.current.localParticipant.setCameraEnabled(false);
      setIsVideoEnabled(false);
    } else {
      await roomRef.current.localParticipant.setCameraEnabled(true);
      setIsVideoEnabled(true);
    }
  }, []);

  // Screen sharing toggle - shares desktop/window/tab
  const toggleScreenShare = useCallback(async () => {
    if (!roomRef.current?.localParticipant) {
      console.warn('[useLiveKit] Cannot share screen: No room or local participant');
      return;
    }

    const localParticipant = roomRef.current.localParticipant;

    try {
      if (isScreenSharing) {
        // Stop screen sharing
        console.log('[useLiveKit] Stopping screen share...');
        await localParticipant.setScreenShareEnabled(false);
        setIsScreenSharing(false);
        setScreenShareTrack(null);
        console.log('[useLiveKit] ✓ Screen share stopped');
      } else {
        // Start screen sharing
        console.log('[useLiveKit] Starting screen share...');
        
        // Request screen share with audio (if available)
        const screenSharePublication = await localParticipant.setScreenShareEnabled(true, {
          audio: true, // Try to capture system audio
          video: {
            displaySurface: 'monitor', // Prefer monitor over window/tab
          },
          surfaceSwitching: 'include', // Allow switching surfaces during share
          selfBrowserSurface: 'include', // Include current tab option
          systemAudio: 'include', // Include system audio option
        });
        
        console.log('[useLiveKit] setScreenShareEnabled returned:', screenSharePublication);
        
        // Wait a bit for the track to be published
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get the screen share track - check all track publications
        let foundScreenTrack: Track | null = null;
        
        // Method 1: Check videoTrackPublications for screen share source
        for (const [, pub] of localParticipant.videoTrackPublications) {
          console.log('[useLiveKit] Checking publication:', {
            trackName: pub.trackName,
            source: pub.source,
            kind: pub.kind,
            hasTrack: !!pub.track
          });
          
          // LiveKit uses Track.Source.ScreenShare for screen share tracks
          if (pub.source === Track.Source.ScreenShare || 
              pub.source === Track.Source.ScreenShareAudio ||
              pub.trackName?.toLowerCase().includes('screen')) {
            foundScreenTrack = pub.track || null;
            console.log('[useLiveKit] ✓ Found screen share track via source:', pub.source);
            break;
          }
        }
        
        // Method 2: If not found, check all track publications
        if (!foundScreenTrack) {
          for (const [, pub] of localParticipant.trackPublications) {
            if (pub.source === Track.Source.ScreenShare && pub.track) {
              foundScreenTrack = pub.track || null;
              console.log('[useLiveKit] ✓ Found screen share track via trackPublications');
              break;
            }
          }
        }
        
        if (foundScreenTrack) {
          setScreenShareTrack(foundScreenTrack);
          setIsScreenSharing(true);
          console.log('[useLiveKit] ✓ Screen share started successfully with track');
          
          // Listen for track ended event (user stops sharing via browser UI)
          foundScreenTrack.on('ended', () => {
            console.log('[useLiveKit] Screen share track ended (user stopped sharing)');
            setIsScreenSharing(false);
            setScreenShareTrack(null);
          });
        } else {
          // Track might be published but not yet available - set state anyway
          setIsScreenSharing(true);
          console.log('[useLiveKit] ✓ Screen share started (track not yet available)');
        }
      }
    } catch (err: any) {
      console.error('[useLiveKit] Screen share error:', err);
      
      // Handle user cancellation (NotAllowedError)
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        console.log('[useLiveKit] User cancelled screen share selection');
      } else {
        // Show error for other issues
        console.error('[useLiveKit] Failed to toggle screen share:', err.message);
      }
      
      // Reset state on error
      setIsScreenSharing(false);
      setScreenShareTrack(null);
    }
  }, [isScreenSharing]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    room,
    participants,
    localParticipant,
    isConnected,
    isConnecting,
    isPeerConnected, // Export peer connection state
    error,
    connectionQuality,
    connect,
    disconnect,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    screenShareTrack,
  };
};




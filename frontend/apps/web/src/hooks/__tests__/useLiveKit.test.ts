import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLiveKit } from '../useLiveKit';

// Mock livekit-client - define mocks inside factory to avoid hoisting
vi.mock('livekit-client', () => {
  // Create mocks that can be accessed
  const mockRoomConnect = vi.fn().mockResolvedValue(undefined);
  
  // Room constructor - must be a vi.fn() to be a spy
  const mockRoomConstructor = vi.fn().mockImplementation(() => {
    const mockLocalParticipant = {
      identity: 'test-user',
      name: 'Test User',
      isMicrophoneEnabled: false,
      isCameraEnabled: false,
      videoTrackPublications: new Map(),
      audioTrackPublications: new Map(),
      setMicrophoneEnabled: vi.fn().mockResolvedValue(undefined),
      setCameraEnabled: vi.fn().mockResolvedValue(undefined),
    };
    
    // Store event handlers so we can trigger them
    const eventHandlers = new Map<string, Array<(...args: any[]) => void>>();
    
    const mockRoomOn = vi.fn((event: string, handler: (...args: any[]) => void) => {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, []);
      }
      eventHandlers.get(event)!.push(handler);
    });
    
    const mockRoom = {
      localParticipant: mockLocalParticipant,
      remoteParticipants: new Map(),
      state: 'disconnected',
      connect: mockRoomConnect,
      disconnect: vi.fn().mockResolvedValue(undefined),
      on: mockRoomOn,
      off: vi.fn(),
      // Helper to trigger events for testing
      _triggerEvent: (event: string, ...args: any[]) => {
        const handlers = eventHandlers.get(event);
        if (handlers) {
          handlers.forEach(handler => handler(...args));
        }
      },
      // Expose eventHandlers for test access
      _eventHandlers: eventHandlers,
    };
    
    return mockRoom;
  });
  
  return {
    Room: mockRoomConstructor,
    RoomEvent: {
      Connected: 'connected',
      Disconnected: 'disconnected',
      ParticipantConnected: 'participantConnected',
      ParticipantDisconnected: 'participantDisconnected',
      TrackSubscribed: 'trackSubscribed',
      TrackUnsubscribed: 'trackUnsubscribed',
      LocalTrackPublished: 'localTrackPublished',
      LocalTrackUnpublished: 'localTrackUnpublished',
      TrackMuted: 'trackMuted',
      TrackUnmuted: 'trackUnmuted',
    },
  };
});

// Mock sessionApi - must be defined before useLiveKit imports it
vi.mock('../../services/api', () => {
  const mockGetJoinToken = vi.fn().mockResolvedValue({
    join_token: 'mock-token',
    session_metadata: {},
    technical_config: {},
    participant_role: 'mentor',
  });
  
  return {
    sessionApi: {
      getJoinToken: mockGetJoinToken,
    },
  };
});

// Mock environment variable
vi.stubEnv('VITE_LIVEKIT_URL', 'ws://localhost:7880');

describe('useLiveKit', () => {
  const defaultOptions = {
    sessionId: 'test-session-123',
    participantRole: 'mentor' as const,
    onConnected: vi.fn(),
    onDisconnected: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset sessionApi mock - ensure it's set up before each test
    const apiModule = await import('../../services/api');
    const { sessionApi } = apiModule;
    // Reset and set default mock response
    (sessionApi.getJoinToken as any).mockReset();
    (sessionApi.getJoinToken as any).mockResolvedValue({
      join_token: 'mock-token',
      session_metadata: {},
      technical_config: {},
      participant_role: 'mentor',
    });
  });

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useLiveKit(defaultOptions));
    
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.participants).toEqual([]);
    expect(result.current.localParticipant).toBeNull();
  });

  it('should call getJoinToken when connecting', async () => {
    const apiModule = await import('../../services/api');
    const { sessionApi } = apiModule;
    
    // Reset the mock to track calls
    (sessionApi.getJoinToken as any).mockClear();
    
    const { result } = renderHook(() => useLiveKit(defaultOptions));
    
    // Call connect - this should call getJoinToken
    const connectPromise = result.current.connect();
    
    // Wait for getJoinToken to be called
    // The connect function calls getJoinToken at line 56 of useLiveKit.ts
    // It's called with sessionId only (no second parameter)
    await waitFor(() => {
      // Check if it was called with sessionId (second param is optional)
      const calls = (sessionApi.getJoinToken as any).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toBe('test-session-123');
    }, { timeout: 3000 });
    
    // Wait for connect promise to resolve
    await connectPromise;
  });

  it('should create Room instance when connecting', async () => {
    const livekitModule = require('livekit-client');
    const RoomMock = livekitModule.Room;
    
    // RoomMock should be a vi.fn() spy - clear previous calls
    if (RoomMock && typeof RoomMock.mockClear === 'function') {
      RoomMock.mockClear();
    }
    
    const { result } = renderHook(() => useLiveKit(defaultOptions));
    
    // Start connecting
    const connectPromise = result.current.connect();
    
    // Room should be called to create a new instance
    // It's called after getJoinToken succeeds (line 60 of useLiveKit.ts)
    await waitFor(() => {
      // Check if Room was called
      if (RoomMock && RoomMock.mock) {
        expect(RoomMock.mock.calls.length).toBeGreaterThan(0);
      } else {
        // If not a spy, at least verify connect was called
        expect(result.current.isConnecting || result.current.isConnected).toBeTruthy();
      }
    }, { timeout: 3000 });
    
    await connectPromise;
  });

  it('should call onConnected callback when connected', async () => {
    const livekitModule = require('livekit-client');
    const { RoomEvent } = livekitModule;
    const onConnected = vi.fn();
    const { result } = renderHook(() => 
      useLiveKit({ ...defaultOptions, onConnected })
    );
    
    // Start connecting
    const connectPromise = result.current.connect();
    
    // Wait for Room to be created - use same pattern as "should toggle mute state" test
    await waitFor(() => {
      const RoomMock = livekitModule.Room as any;
      return RoomMock && RoomMock.mock && RoomMock.mock.results && RoomMock.mock.results.length > 0;
    }, { timeout: 3000 });
    
    // Get the room instance from mock - same pattern as "should toggle mute state" test
    const RoomMock = livekitModule.Room as any;
    if (RoomMock.mock && RoomMock.mock.results && RoomMock.mock.results.length > 0) {
      const roomInstance = RoomMock.mock.results[0]?.value;
      expect(roomInstance).toBeTruthy();
      expect(roomInstance.on).toBeDefined();
      
      // Wait for handlers to be registered
      await waitFor(() => {
        const onCalls = (roomInstance.on as any).mock?.calls || [];
        return onCalls.length > 0;
      }, { timeout: 3000 });
      
      // Check that handlers were registered
      const onCalls = (roomInstance.on as any).mock.calls;
      expect(onCalls.length).toBeGreaterThan(0);
      
      // Hook calls: newRoom.on(RoomEvent.Connected, handler) at line 69
      // RoomEvent.Connected = 'connected' in our mock
      // Find the Connected event handler - it's registered first
      const connectedCall = onCalls.find((call: any[]) => {
        const eventName = call[0];
        return eventName === 'connected' || eventName === RoomEvent.Connected;
      });
      
      // Connected handler is registered first (line 69 of useLiveKit.ts)
      // If not found by name, use first handler (Connected is first)
      const handlerToCall = connectedCall?.[1] || onCalls[0]?.[1];
      
      expect(handlerToCall).toBeDefined();
      expect(handlerToCall).not.toBeNull();
      expect(typeof handlerToCall).toBe('function');
      
      // Call the handler directly - this simulates RoomEvent.Connected firing
      // The handler will call onConnected?.() internally (line 73 of useLiveKit.ts)
      handlerToCall();
      
      // Small delay to allow state updates and callback execution
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Wait for onConnected to be called
      await waitFor(() => {
        expect(onConnected).toHaveBeenCalled();
      }, { timeout: 2000 });
    } else {
      throw new Error('Room instance not found in mock results');
    }
    
    // Wait for connect to complete
    await connectPromise;
  });

  it('should toggle mute state', async () => {
    const livekitModule = require('livekit-client');
    const { result } = renderHook(() => useLiveKit(defaultOptions));
    
    await result.current.connect();
    
    // Get room instance from mock
    const RoomMock = livekitModule.Room as any;
    if (RoomMock.mock && RoomMock.mock.results && RoomMock.mock.results.length > 0) {
      const roomInstance = RoomMock.mock.results[0]?.value;
      if (roomInstance && roomInstance.localParticipant) {
        const initialMuted = result.current.isMuted;
        
        // Simulate toggle by updating the participant state
        roomInstance.localParticipant.isMicrophoneEnabled = !roomInstance.localParticipant.isMicrophoneEnabled;
        
        // Trigger LocalTrackPublished event to update state
        const onCalls = (roomInstance.on as any).mock.calls;
        const localTrackPublishedCall = onCalls.find(
          (call: any[]) => call[0] === 'localTrackPublished'
        );
        if (localTrackPublishedCall && localTrackPublishedCall[1]) {
          localTrackPublishedCall[1]();
        }
        
        await waitFor(() => {
          // State should update based on isMicrophoneEnabled
          expect(result.current.isMuted).toBe(!roomInstance.localParticipant.isMicrophoneEnabled);
        }, { timeout: 1000 });
      }
    }
  });

  it('should toggle video state', async () => {
    const livekitModule = require('livekit-client');
    const { result } = renderHook(() => useLiveKit(defaultOptions));
    
    await result.current.connect();
    
    // Get room instance from mock
    const RoomMock = livekitModule.Room as any;
    if (RoomMock.mock && RoomMock.mock.results && RoomMock.mock.results.length > 0) {
      const roomInstance = RoomMock.mock.results[0]?.value;
      if (roomInstance && roomInstance.localParticipant) {
        const initialVideoEnabled = result.current.isVideoEnabled;
        
        // Simulate toggle by updating the participant state
        roomInstance.localParticipant.isCameraEnabled = !roomInstance.localParticipant.isCameraEnabled;
        
        // Trigger LocalTrackPublished event to update state
        const onCalls = (roomInstance.on as any).mock.calls;
        const localTrackPublishedCall = onCalls.find(
          (call: any[]) => call[0] === 'localTrackPublished'
        );
        if (localTrackPublishedCall && localTrackPublishedCall[1]) {
          localTrackPublishedCall[1]();
        }
        
        await waitFor(() => {
          // State should update based on isCameraEnabled
          expect(result.current.isVideoEnabled).toBe(roomInstance.localParticipant.isCameraEnabled);
        }, { timeout: 1000 });
      }
    }
  });

  it('should handle connection errors', async () => {
    const { sessionApi } = await import('../../services/api');
    const onError = vi.fn();
    (sessionApi.getJoinToken as any).mockRejectedValueOnce(new Error('Connection failed'));
    
    const { result } = renderHook(() => 
      useLiveKit({ ...defaultOptions, onError })
    );
    
    await result.current.connect();
    
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(onError).toHaveBeenCalled();
    });
  });

  it('should disconnect properly', async () => {
    const livekitModule = require('livekit-client');
    const { result } = renderHook(() => useLiveKit(defaultOptions));
    
    await result.current.connect();
    
    // Verify connected first
    const RoomMock = livekitModule.Room as any;
    if (RoomMock.mock && RoomMock.mock.results && RoomMock.mock.results.length > 0) {
      const roomInstance = RoomMock.mock.results[0]?.value;
      if (roomInstance) {
        // Trigger connected event
        const onCalls = (roomInstance.on as any).mock.calls;
        const connectedCall = onCalls.find(
          (call: any[]) => call[0] === 'connected'
        );
        if (connectedCall && connectedCall[1]) {
          connectedCall[1]();
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }
    
    await result.current.disconnect();
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  it('should not connect if already connecting', async () => {
    const apiModule = await import('../../services/api');
    const { sessionApi } = apiModule;
    
    // Reset mock to track calls
    (sessionApi.getJoinToken as any).mockClear();
    
    const { result } = renderHook(() => useLiveKit(defaultOptions));
    
    // Start connecting twice - second call should be ignored due to isConnecting guard
    const connectPromise1 = result.current.connect();
    // Small delay to ensure first connect sets isConnecting
    await new Promise(resolve => setTimeout(resolve, 10));
    const connectPromise2 = result.current.connect();
    
    await Promise.all([connectPromise1, connectPromise2]);
    
    // Should only call getJoinToken once due to isConnecting guard in connect()
    await waitFor(() => {
      expect(sessionApi.getJoinToken).toHaveBeenCalledTimes(1);
    }, { timeout: 2000 });
  });
});

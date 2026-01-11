/**
 * LiveKit Mocks for Testing
 * 
 * Mock implementations of LiveKit Room and related classes
 * for testing video/audio functionality without actual WebRTC connections.
 */
import { vi } from 'vitest';

// Mock LocalParticipant
export const createMockLocalParticipant = () => ({
  identity: 'test-user',
  name: 'Test User',
  isMicrophoneEnabled: false,
  isCameraEnabled: false,
  videoTrackPublications: new Map(),
  audioTrackPublications: new Map(),
  setMicrophoneEnabled: vi.fn().mockResolvedValue(undefined),
  setCameraEnabled: vi.fn().mockResolvedValue(undefined),
  publishTrack: vi.fn().mockResolvedValue(undefined),
  unpublishTrack: vi.fn().mockResolvedValue(undefined),
});

// Mock RemoteParticipant
export const createMockRemoteParticipant = () => ({
  identity: 'remote-user',
  name: 'Remote User',
  videoTrackPublications: new Map(),
  audioTrackPublications: new Map(),
});

// Mock Room
export const createMockRoom = () => {
  const mockLocalParticipant = createMockLocalParticipant();
  const mockRemoteParticipant = createMockRemoteParticipant();

  const mockRoom = {
    localParticipant: mockLocalParticipant,
    remoteParticipants: new Map([['remote-user', mockRemoteParticipant]]),
    state: 'connected',
    connect: vi.fn().mockImplementation(async () => {
      // Simulate connection success
      return Promise.resolve();
    }),
    disconnect: vi.fn().mockImplementation(async () => {
      return Promise.resolve();
    }),
    on: vi.fn(),
    off: vi.fn(),
    removeAllListeners: vi.fn(),
  };

  return {
    room: mockRoom,
    localParticipant: mockLocalParticipant,
    remoteParticipant: mockRemoteParticipant,
  };
};

/**
 * Mock LiveKit Room class globally
 */
export const mockLiveKitRoom = () => {
  const { Room } = require('livekit-client');
  
  const OriginalRoom = Room;
  
  // Mock Room constructor
  const MockRoom = vi.fn().mockImplementation((options?: any) => {
    const room = {
      localParticipant: createMockLocalParticipant(),
      remoteParticipants: new Map(),
      state: 'disconnected',
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      off: vi.fn(),
      removeAllListeners: vi.fn(),
    };
    return room;
  });

  // Copy static properties
  Object.setPrototypeOf(MockRoom, OriginalRoom);
  
  return MockRoom;
};

/**
 * Mock WebRTC media devices
 */
export const mockMediaDevices = () => {
  global.navigator = {
    ...global.navigator,
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [],
        getVideoTracks: () => [],
        getAudioTracks: () => [],
      }),
      enumerateDevices: vi.fn().mockResolvedValue([]),
    } as any,
  };
};

/**
 * API Mocks for Testing
 * 
 * Mock data and functions for all API endpoints used in the application
 */
import { vi } from 'vitest';
import type {
  SessionCreationResponse,
  JoinSessionResponse,
  SessionStartResponse,
  SessionEndResponse,
  SessionStatusResponse,
  EmergencyTerminationResponse,
  RecordingConfigurationResponse,
} from '../types/session';

// Mock data constants
export const mockSessionId = 'test-session-123';
export const mockUserId = 'test-user-123';
export const mockRecordingId = 'recording-123';

// Mock API responses
export const mockJoinTokenResponse: JoinSessionResponse = {
  join_token: 'mock-join-token-xyz',
  session_metadata: {
    session_id: mockSessionId,
    room_name: 'test-room',
  },
  technical_config: {},
  participant_role: 'mentor',
  session_features: {},
  emergency_controls: {},
};

export const mockSessionStatusResponse: SessionStatusResponse = {
  status: 'started',
  participants: [
    {
      id: 'user-1',
      display_name: 'You',
      role: 'Mentorship Provider',
    },
    {
      id: 'user-2',
      display_name: 'Alex Chen',
      role: 'Patient',
    },
  ],
};

export const mockSessionStartResponse: SessionStartResponse = {
  session_started: true,
  start_timestamp: new Date().toISOString(),
  recording_status: {
    recording_id: mockRecordingId,
    status: 'active',
  },
  transcription_status: {
    enabled: true,
    status: 'active',
  },
  ai_monitoring_status: {
    enabled: true,
    status: 'active',
  },
};

export const mockSessionEndResponse: SessionEndResponse = {
  session_ended: true,
  end_timestamp: new Date().toISOString(),
  session_duration: 3600,
  recording_ids: [mockRecordingId],
  transcript_id: 'transcript-123',
};

export const mockEmergencyTerminationResponse: EmergencyTerminationResponse = {
  session_terminated: true,
  termination_timestamp: new Date().toISOString(),
  emergency_incident_id: 'incident-123',
  recording_preserved: true,
  notification_sent: true,
};

export const mockRecordingConfigResponse: RecordingConfigurationResponse = {
  recording_configured: true,
  recording_id: mockRecordingId,
  storage_location: 's3://bucket/recordings',
  estimated_file_size: 1024000,
};

/**
 * Setup API mocks using Vitest
 * Call this in beforeEach of your tests
 */
export const setupApiMocks = () => {
  // Mock sessionApi
  vi.mock('../services/api', async () => {
    const actual = await vi.importActual('../services/api');
    return {
      ...actual,
      sessionApi: {
        createSession: vi.fn().mockResolvedValue({
          session_id: mockSessionId,
          session_room: {},
          join_tokens: {},
          session_metadata_pointer: 'metadata-123',
          estimated_duration: 3600,
        } as SessionCreationResponse),
        getJoinToken: vi.fn().mockResolvedValue(mockJoinTokenResponse),
        startSession: vi.fn().mockResolvedValue(mockSessionStartResponse),
        endSession: vi.fn().mockResolvedValue(mockSessionEndResponse),
        emergencyTerminate: vi.fn().mockResolvedValue(mockEmergencyTerminationResponse),
        getSessionStatus: vi.fn().mockResolvedValue(mockSessionStatusResponse),
      },
      recordingApi: {
        configureRecording: vi.fn().mockResolvedValue(mockRecordingConfigResponse),
        getRecordingAccess: vi.fn().mockResolvedValue({
          access_url: 'https://example.com/recording',
          access_expires_at: new Date(Date.now() + 3600000).toISOString(),
        }),
        configureTranscription: vi.fn().mockResolvedValue({
          status: 'success',
          message: 'Transcription configured',
        }),
      },
    };
  });
};

/**
 * Reset all API mocks
 */
export const resetApiMocks = () => {
  vi.restoreAllMocks();
};

/**
 * Get mock sessionApi for direct use in tests
 */
export const getMockSessionApi = () => ({
  createSession: vi.fn().mockResolvedValue({
    session_id: mockSessionId,
    session_room: {},
    join_tokens: {},
    session_metadata_pointer: 'metadata-123',
    estimated_duration: 3600,
  }),
  getJoinToken: vi.fn().mockResolvedValue(mockJoinTokenResponse),
  startSession: vi.fn().mockResolvedValue(mockSessionStartResponse),
  endSession: vi.fn().mockResolvedValue(mockSessionEndResponse),
  emergencyTerminate: vi.fn().mockResolvedValue(mockEmergencyTerminationResponse),
  getSessionStatus: vi.fn().mockResolvedValue(mockSessionStatusResponse),
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockSessionId,
  mockJoinTokenResponse,
  mockSessionStartResponse,
  mockSessionEndResponse,
  mockSessionStatusResponse,
  mockEmergencyTerminationResponse,
  mockRecordingConfigResponse,
} from '../../test/api-mocks';

// Mock axios - create instance inside factory to avoid hoisting
vi.mock('axios', () => {
  const mockInstance = {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
  };
  
  // Store in global for access
  (globalThis as any).__testMockAxiosInstance__ = mockInstance;
  
  return {
    default: {
      create: vi.fn(() => mockInstance),
    },
  };
});

// Import after mocking
import { sessionApi, recordingApi } from '../api';

// Get the shared mock instance
const getMockInstance = () => {
  return (globalThis as any).__testMockAxiosInstance__;
};

describe('sessionApi', () => {
  let mockAxiosInstance: any;
  
  beforeEach(() => {
    // Mock localStorage
    Storage.prototype.getItem = vi.fn(() => 'mock-token');
    
    // Get the shared mock instance - this is the SAME instance used by apiClient
    mockAxiosInstance = getMockInstance();
    
    if (!mockAxiosInstance) {
      throw new Error('Failed to get mock instance');
    }
    
    // Clear call history
    mockAxiosInstance.post.mockClear();
    mockAxiosInstance.get.mockClear();
  });

  describe('createSession', () => {
    it('should create a session successfully', async () => {
      const mockResponse = {
        data: {
          session_id: mockSessionId,
          session_room: {},
          join_tokens: {},
          session_metadata_pointer: 'metadata-123',
          estimated_duration: 3600,
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const request = {
        booking_id: 'booking-123',
        session_config: {},
        recording_preferences: {},
      };

      const result = await sessionApi.createSession(request);

      expect(result).toEqual(mockResponse.data);
      
      // Verify the call was made
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/sessions/create',
        request
      );
    });
  });

  describe('getJoinToken', () => {
    it('should get join token successfully', async () => {
      const mockResponse = { data: mockJoinTokenResponse };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await sessionApi.getJoinToken(mockSessionId);

      expect(result).toEqual(mockJoinTokenResponse);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/sessions/${mockSessionId}/join-token`,
        { params: {} }
      );
    });

    it('should get join token with device info', async () => {
      const mockResponse = { data: mockJoinTokenResponse };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await sessionApi.getJoinToken(mockSessionId, 'device-info-123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/sessions/${mockSessionId}/join-token`,
        { params: { device_info: 'device-info-123' } }
      );
    });
  });

  describe('startSession', () => {
    it('should start session successfully', async () => {
      const mockResponse = { data: mockSessionStartResponse };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await sessionApi.startSession(mockSessionId);

      expect(result).toEqual(mockSessionStartResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/sessions/${mockSessionId}/start`,
        {}
      );
    });

    it('should start session with goals', async () => {
      const mockResponse = { data: mockSessionStartResponse };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const goals = ['goal1', 'goal2'];
      await sessionApi.startSession(mockSessionId, goals);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/sessions/${mockSessionId}/start`,
        { session_goals: goals }
      );
    });
  });

  describe('endSession', () => {
    it('should end session successfully', async () => {
      const mockResponse = { data: mockSessionEndResponse };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await sessionApi.endSession(
        mockSessionId,
        'user-123',
        'normal_completion'
      );

      expect(result).toEqual(mockSessionEndResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/sessions/${mockSessionId}/end`,
        {
          ended_by: 'user-123',
          end_reason: 'normal_completion',
          session_summary: undefined,
        }
      );
    });

    it('should end session with summary', async () => {
      const mockResponse = { data: mockSessionEndResponse };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const summary = { notes: 'Test summary' };
      await sessionApi.endSession(
        mockSessionId,
        'user-123',
        'normal_completion',
        summary
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/sessions/${mockSessionId}/end`,
        {
          ended_by: 'user-123',
          end_reason: 'normal_completion',
          session_summary: summary,
        }
      );
    });
  });

  describe('emergencyTerminate', () => {
    it('should emergency terminate session successfully', async () => {
      const mockResponse = { data: mockEmergencyTerminationResponse };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const request = {
        terminated_by: 'user-123',
        emergency_reason: 'safety_concern' as const,
        emergency_notes: 'Test notes',
      };

      const result = await sessionApi.emergencyTerminate(mockSessionId, request);

      expect(result).toEqual(mockEmergencyTerminationResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/sessions/${mockSessionId}/emergency-terminate`,
        request
      );
    });
  });

  describe('getSessionStatus', () => {
    it('should get session status successfully', async () => {
      const mockResponse = { data: mockSessionStatusResponse };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await sessionApi.getSessionStatus(mockSessionId);

      expect(result).toEqual(mockSessionStatusResponse);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/sessions/${mockSessionId}/status`,
        { params: { detail_level: 'basic' } }
      );
    });

    it('should get session status with detail level', async () => {
      const mockResponse = { data: mockSessionStatusResponse };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await sessionApi.getSessionStatus(mockSessionId, 'detailed');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/sessions/${mockSessionId}/status`,
        { params: { detail_level: 'detailed' } }
      );
    });
  });

  describe('listSessions', () => {
    it('should list sessions successfully', async () => {
      const mockResponse = {
        data: {
          sessions: [
            {
              session_id: mockSessionId,
              status: 'created',
              mentor_id: 'mentor-1',
              patient_id: 'patient-1',
              planned_duration: 60,
            },
          ],
          total: 1,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await sessionApi.listSessions();

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/sessions');
    });
  });
});

describe('recordingApi', () => {
  let mockAxiosInstance: any;
  
  beforeEach(() => {
    // Get the shared mock instance
    mockAxiosInstance = getMockInstance();
    
    // Clear call history
    const mockInstance = (globalThis as any).__testMockAxiosInstance__;
    if (mockInstance) {
      mockInstance.post.mockClear();
      mockInstance.get.mockClear();
    }
  });

  describe('configureRecording', () => {
    it('should configure recording successfully', async () => {
      const mockResponse = { data: mockRecordingConfigResponse };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const config = {
        recording_consent: true,
        recording_settings: {},
        retention_policy: {},
      };

      const result = await recordingApi.configureRecording(mockSessionId, config);

      expect(result).toEqual(mockRecordingConfigResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/sessions/${mockSessionId}/recording`,
        config
      );
    });
  });

  describe('getRecordingAccess', () => {
    it('should get recording access successfully', async () => {
      const mockResponse = {
        data: {
          access_url: 'https://example.com/recording',
          access_expires_at: new Date().toISOString(),
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await recordingApi.getRecordingAccess(
        'recording-123',
        'user-123',
        'review'
      );

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/recordings/recording-123',
        {
          params: {
            requesting_user_id: 'user-123',
            access_purpose: 'review',
          },
        }
      );
    });
  });

  describe('configureTranscription', () => {
    it('should configure transcription successfully', async () => {
      const mockResponse = {
        data: { status: 'success', message: 'Transcription configured' },
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const config = {
        transcription_config: {},
        consent_flags: {},
      };

      const result = await recordingApi.configureTranscription(mockSessionId, config);

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/sessions/${mockSessionId}/transcription/configure`,
        config
      );
    });
  });
});

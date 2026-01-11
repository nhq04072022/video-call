/**
 * API service for Session Management
 * Integrated with backend API at /api/sessions
 */
import axios from 'axios';
import type {
  SessionCreationRequest,
  SessionCreationResponse,
  JoinSessionResponse,
  SessionStartResponse,
  SessionEndResponse,
  SessionStatusResponse,
  RecordingConfiguration,
  RecordingConfigurationResponse,
  RecordingAccessResponse,
  RealtimeTranscriptionConfig,
  EmergencyTerminateRequest,
  EmergencyTerminationResponse,
  SessionListResponse,
} from '../types/session';
import { useAuthStore } from '../stores/authStore';

// API base URL (matches backend service)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Backend response types
interface BackendJoinTokenResponse {
  token: string;
  url: string;
  roomName: string;
}

interface BackendStartResponse {
  success: boolean;
  message: string;
  session_id?: string;
  start_time?: string;
  roomName: string;
}

interface BackendEndResponse {
  success: boolean;
  message: string;
  session_id?: string;
  end_time?: string;
  duration_minutes?: number | null;
}

interface BackendEmergencyTerminationResponse {
  success: boolean;
  message: string;
  session_id: string;
  status: string;
  end_time: string;
  duration_minutes: number | null;
  emergency_reason: string | null;
}

interface BackendStatusResponse {
  roomName: string;
  status: string;
  isActive: boolean;
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor - uses Zustand authStore
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses - auto logout
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Session Lifecycle APIs
export const sessionApi = {
  /**
   * Create a new session
   * Maps to: POST /api/sessions/create
   */
  createSession: async (request: SessionCreationRequest): Promise<SessionCreationResponse> => {
    try {
      // Extract mentor_id and mentee_id from request
      // The request format from frontend may have session_config with mentor_id/patient_id
      // or we need to get it from auth store
      const user = useAuthStore.getState().user;
      if (!user) {
        throw new Error('User must be logged in to create a session');
      }

      // Determine mentor_id and mentee_id
      // If user is mentee, mentor_id comes from request or URL
      // If user is mentor, they can't create sessions for themselves
      let mentorId: string;
      let menteeId: string = user.id;

      if (request.session_config?.mentor_id) {
        mentorId = request.session_config.mentor_id;
      } else {
        throw new Error('Mentor ID is required');
      }

      // Prepare backend request format
      const backendRequest = {
        mentor_id: mentorId,
        mentee_id: menteeId,
        mentee_goal: request.session_config?.mentee_goal || '',
        mentee_questions: request.session_config?.mentee_questions || '',
        scheduled_time: request.session_config?.scheduled_start_time || new Date().toISOString(),
      };

      const response = await apiClient.post<{
        id: string;
        mentor_id: string;
        mentee_id: string;
        status: string;
        scheduled_time: string;
        mentee_goal: string;
        mentee_questions: string;
        livekit_room_name: string;
        created_at: string;
        updated_at: string;
      }>('/api/sessions/create', backendRequest);

      // Map backend response to frontend format
      return {
        session_id: response.data.id,
        session_room: {
          room_name: response.data.livekit_room_name,
          room_id: response.data.livekit_room_name,
        },
        join_tokens: {}, // Will be generated when joining
        session_metadata_pointer: response.data.id,
        estimated_duration: 60, // Default duration
      };
    } catch (error: any) {
      console.error('Error creating session:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to create this session.');
      }
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.error || 'Invalid request data.');
      }
      throw error;
    }
  },

  /**
   * Create a session from a confirmed booking
   * Note: Backend doesn't support this yet
   */
  createSessionFromBooking: async (_bookingId: string): Promise<SessionCreationResponse> => {
    throw new Error('Session creation from booking not yet implemented in backend');
  },

  /**
   * Get join token for a session
   * Maps to: GET /api/sessions/join-token
   */
  /**
   * Log participant leave event
   * Maps to: POST /api/sessions/:sessionId/leave
   */
  logParticipantLeave: async (sessionId: string): Promise<void> => {
    try {
      await apiClient.post(`/api/sessions/${sessionId}/leave`);
      console.log(`[sessionApi.logParticipantLeave] ✓ Logged participant leave to DB - Session: ${sessionId}`);
    } catch (err: any) {
      console.error('[sessionApi.logParticipantLeave] Error logging participant leave:', err);
      // Don't throw - this is a logging operation, shouldn't block disconnect
    }
  },

  /**
   * Get current participants in session from database
   * Maps to: GET /api/sessions/:sessionId/participants
   */
  getSessionParticipants: async (sessionId: string): Promise<{ participants: any[], total: number }> => {
    try {
      const response = await apiClient.get(`/api/sessions/${sessionId}/participants`);
      return response.data;
    } catch (err: any) {
      console.error('[sessionApi.getSessionParticipants] Error getting participants:', err);
      throw err;
    }
  },

  getJoinToken: async (sessionId?: string, _deviceInfo?: string): Promise<JoinSessionResponse> => {
    try {
      // Pass sessionId as query parameter if provided
      const url = sessionId 
        ? `/api/sessions/join-token?sessionId=${encodeURIComponent(sessionId)}`
        : '/api/sessions/join-token';
      
      console.log(`[sessionApi.getJoinToken] Requesting token - SessionId: ${sessionId || 'none'}, URL: ${url}`);
      
      const response = await apiClient.get<BackendJoinTokenResponse>(url);
      
      console.log(`[sessionApi.getJoinToken] ✓ Received response:`, { 
        roomName: response.data.roomName, 
        livekitUrl: response.data.url,
        hasToken: !!response.data.token 
      });
      
      // Backend returns: { token, url, roomName }
      // Frontend expects: { join_token, technical_config, session_metadata }
      // Ensure URL is in correct format (ws:// or wss://)
      let livekitUrl = response.data.url;
      if (!livekitUrl.startsWith('ws://') && !livekitUrl.startsWith('wss://')) {
        // If URL doesn't have protocol, add ws://
        livekitUrl = `ws://${livekitUrl}`;
      }
      
      return {
        join_token: response.data.token,
        session_metadata: {
          room_name: response.data.roomName,
          room_id: response.data.roomName,
          url: livekitUrl,
        },
        technical_config: {
          livekit_url: livekitUrl, // This is what useLiveKit.ts looks for
          url: livekitUrl,
          room_id: response.data.roomName,
          room_name: response.data.roomName,
        },
        participant_role: 'mentor', // Will be determined by user role
        session_features: {},
        emergency_controls: {},
      };
    } catch (error: any) {
      console.error('[sessionApi.getJoinToken] ✗ Error:', error);
      // Re-throw with more context
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      if (error.response?.status === 500) {
        throw new Error('LiveKit server not configured. Please check backend configuration.');
      }
      throw error;
    }
  },

  /**
   * Start a session
   * Maps to: POST /api/sessions/start
   */
  startSession: async (sessionId?: string, _sessionGoals?: string[]): Promise<SessionStartResponse> => {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    const response = await apiClient.post<BackendStartResponse>('/api/sessions/start', {
      sessionId,
    });
    return {
      session_started: response.data.success,
      start_timestamp: response.data.start_time || new Date().toISOString(),
    };
  },

  /**
   * End a session
   * Maps to: POST /api/sessions/end
   */
  endSession: async (
    sessionId?: string,
    _endedBy?: string,
    _endReason?: string,
    _sessionSummary?: Record<string, any>
  ): Promise<SessionEndResponse> => {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    const response = await apiClient.post<BackendEndResponse>('/api/sessions/end', {
      sessionId,
    });
    return {
      session_ended: response.data.success,
      end_timestamp: response.data.end_time || new Date().toISOString(),
      session_duration: response.data.duration_minutes || 0,
    };
  },

  /**
   * Emergency terminate a session
   * Maps to: POST /api/sessions/emergency-terminate
   */
  emergencyTerminate: async (
    sessionId: string,
    request: EmergencyTerminateRequest
  ): Promise<EmergencyTerminationResponse> => {
    const response = await apiClient.post<BackendEmergencyTerminationResponse>(
      '/api/sessions/emergency-terminate',
      {
        sessionId,
        terminated_by: request.terminated_by,
        emergency_reason: request.emergency_reason,
        emergency_notes: request.emergency_notes,
      }
    );
    // Generate emergency incident ID (format: EMERG-{timestamp}-{sessionId short})
    const incidentId = `EMERG-${Date.now()}-${sessionId.substring(0, 8).toUpperCase()}`;
    return {
      session_terminated: response.data.success,
      termination_timestamp: response.data.end_time || new Date().toISOString(),
      emergency_incident_id: incidentId,
      follow_up_procedures: [
        {
          action: 'Session terminated',
          timestamp: response.data.end_time || new Date().toISOString(),
          reason: response.data.emergency_reason || request.emergency_reason,
          notes: request.emergency_notes,
        },
      ],
    };
  },

  /**
   * Accept a session (Mentor only)
   * Maps to: POST /api/sessions/:sessionId/accept
   */
  acceptSession: async (sessionId: string): Promise<{ success: boolean; message: string; session_id: string; status: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string; session_id: string; status: string }>(
      `/api/sessions/${sessionId}/accept`
    );
    return response.data;
  },

  /**
   * Reject a session (Mentor only)
   * Maps to: POST /api/sessions/:sessionId/reject
   */
  rejectSession: async (sessionId: string, reason?: string): Promise<{ success: boolean; message: string; session_id: string; status: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string; session_id: string; status: string }>(
      `/api/sessions/${sessionId}/reject`,
      { reason }
    );
    return response.data;
  },

  /**
   * Get session status
   * Maps to: GET /api/sessions/status
   */
  getSessionStatus: async (
    _sessionId?: string,
    _detailLevel: 'basic' | 'detailed' | 'technical' | 'admin' = 'basic'
  ): Promise<SessionStatusResponse> => {
    const response = await apiClient.get<BackendStatusResponse>('/api/sessions/status');
    return {
      status: response.data.status,
      participants: [],
    };
  },

  /**
   * List all sessions
   * Maps to: GET /api/sessions
   */
  listSessions: async (status?: string, limit?: number, offset?: number): Promise<SessionListResponse> => {
    try {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      if (limit) params.limit = limit.toString();
      if (offset) params.offset = offset.toString();

      const response = await apiClient.get<{
        sessions: Array<{
          id: string;
          mentor_id: string;
          mentee_id: string;
          status: string;
          scheduled_time: string;
          start_time: string | null;
          end_time: string | null;
          duration_minutes: number | null;
          mentee_goal: string;
          mentee_questions: string;
          livekit_room_name: string;
          created_at: string;
          updated_at: string;
        }>;
        total: number;
      }>('/api/sessions', { params });

      return {
        sessions: response.data.sessions.map((s) => ({
          session_id: s.id,
          status: s.status.toLowerCase() as 'created' | 'started' | 'ended',
          mentor_id: s.mentor_id,
          patient_id: s.mentee_id,
          planned_duration: s.duration_minutes || undefined,
          created_at: s.created_at,
          scheduled_start_time: s.scheduled_time,
        })),
        total: response.data.total,
      };
    } catch (error: any) {
      console.error('Error listing sessions:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Get session detail by ID
   * Maps to: GET /api/sessions/:sessionId
   */
  getSessionDetail: async (sessionId: string): Promise<{
    id: string;
    mentor_id: string;
    mentee_id: string;
    status: string;
    scheduled_time: string;
    start_time: string | null;
    end_time: string | null;
    duration_minutes: number | null;
    mentee_goal: string;
    mentee_questions: string;
    livekit_room_name: string;
    created_at: string;
    updated_at: string;
  }> => {
    try {
      const response = await apiClient.get(`/api/sessions/${sessionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting session detail:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to view this session.');
      }
      if (error.response?.status === 404) {
        throw new Error('Session not found.');
      }
      throw error;
    }
  },
};

// Recording APIs
// Note: Backend doesn't support recording APIs yet - these are placeholders
export const recordingApi = {
  /**
   * Configure recording for a session
   * Note: Not yet implemented in backend
   */
  configureRecording: async (
    _sessionId: string,
    _config: RecordingConfiguration
  ): Promise<RecordingConfigurationResponse> => {
    throw new Error('Recording configuration not yet implemented in backend');
  },

  /**
   * Get recording access
   * Note: Not yet implemented in backend
   */
  getRecordingAccess: async (
    _recordingId: string,
    _requestingUserId: string,
    _accessPurpose: 'review' | 'download' | 'streaming' | 'transcription'
  ): Promise<RecordingAccessResponse> => {
    throw new Error('Recording access not yet implemented in backend');
  },

  /**
   * Configure real-time transcription
   * Note: Not yet implemented in backend
   */
  configureTranscription: async (
    _sessionId: string,
    _config: RealtimeTranscriptionConfig
  ): Promise<{ status: string; message: string }> => {
    throw new Error('Transcription configuration not yet implemented in backend');
  },
};

export default apiClient;






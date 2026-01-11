/**
 * MSW handlers for API mocking
 */
import { http, HttpResponse, delay } from 'msw';
import type {
  SessionCreationRequest,
  SessionCreationResponse,
  JoinSessionResponse,
  SessionStartResponse,
  SessionEndResponse,
  SessionStatusResponse,
  RecordingConfigurationResponse,
  RecordingAccessResponse,
  EmergencyTerminationResponse,
  SessionListItem,
  SessionListResponse,
} from '../types/session';
import type { AuthResponse } from '../types/user';

const API_BASE_URL = '/api/v1';

// Mock data generators
const generateSessionId = () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const generateJoinToken = () => `join-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Mock users storage (in-memory for demo)
let mockUsers = [
  {
    email: 'mentor@example.com',
    password: 'password123',
    user: {
      id: 'mentor-1',
      email: 'mentor@example.com',
      name: 'Dr. Smith',
      role: 'mentor' as const,
    },
  },
  {
    email: 'patient@example.com',
    password: 'password123',
    user: {
      id: 'patient-1',
      email: 'patient@example.com',
      name: 'John Doe',
      role: 'patient' as const,
    },
  },
];

// Mock sessions storage (in-memory for demo)
let mockSessions: SessionListItem[] = [
  {
    session_id: '123e4567-e89b-12d3-a456-426614174000',
    status: 'created',
    mentor_id: 'mentor-001',
    patient_id: 'patient-001',
    planned_duration: 60,
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    session_id: '223e4567-e89b-12d3-a456-426614174001',
    status: 'started',
    mentor_id: 'mentor-002',
    patient_id: 'patient-002',
    planned_duration: 45,
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    session_id: '323e4567-e89b-12d3-a456-426614174002',
    status: 'ended',
    mentor_id: 'mentor-003',
    patient_id: 'patient-003',
    planned_duration: 90,
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
];

// Session Lifecycle Handlers
export const handlers = [
  // POST /api/v1/auth/register
  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as {
      full_name: string;
      email: string;
      password: string;
      role: 'mentor' | 'mentee';
    };

    // Check if email already exists
    const existingUser = mockUsers.find((u) => u.email === body.email);
    if (existingUser) {
      return HttpResponse.json(
        { detail: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Validate password
    if (body.password.length < 8) {
      return HttpResponse.json(
        { detail: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate role
    if (body.role !== 'mentor' && body.role !== 'mentee') {
      return HttpResponse.json(
        { detail: 'Invalid role. Must be mentor or mentee' },
        { status: 400 }
      );
    }

    // Create new user
    const newUser = {
      id: `${body.role}-${Date.now()}`,
      email: body.email,
      full_name: body.full_name,
      name: body.full_name, // For backward compatibility
      role: body.role,
      is_active: true,
      is_email_verified: false,
    };

    // Add to mock users
    mockUsers.push({
      email: body.email,
      password: body.password,
      user: newUser,
    });

    const response: AuthResponse = {
      access_token: `mock-token-${newUser.id}-${Date.now()}`,
      token_type: 'bearer',
      user: newUser,
    };

    return HttpResponse.json(response, { status: 201 });
  }),

  // POST /api/v1/auth/login
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as { email: string; password: string };

    // Find user
    const user = mockUsers.find(
      (u) => u.email === body.email && u.password === body.password
    );

    if (!user) {
      return HttpResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const response: AuthResponse = {
      access_token: `mock-token-${user.user.id}-${Date.now()}`,
      token_type: 'bearer',
      user: user.user,
    };

    return HttpResponse.json(response);
  }),

  // POST /api/v1/auth/logout
  http.post(`${API_BASE_URL}/auth/logout`, async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),
  // GET /api/v1/sessions - List all sessions
  http.get(`${API_BASE_URL}/sessions`, async ({ request }) => {
    await delay(200);
    
    // Check for auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const response: SessionListResponse = {
      sessions: mockSessions,
      total: mockSessions.length,
    };
    
    return HttpResponse.json(response);
  }),

  // POST /api/v1/sessions/create
  http.post(`${API_BASE_URL}/sessions/create`, async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as SessionCreationRequest;
    
    const newSessionId = generateSessionId();
    const response: SessionCreationResponse = {
      session_id: newSessionId,
      session_room: {
        room_name: `room-${body.booking_id}`,
        room_url: 'wss://livekit.example.com',
      },
      join_tokens: {
        mentor: generateJoinToken(),
        patient: generateJoinToken(),
      },
      session_metadata_pointer: `metadata-${body.booking_id}`,
      estimated_duration: body.session_config?.planned_duration || 3600,
    };
    
    // Add session to mock storage
    const newSession: SessionListItem = {
      session_id: newSessionId,
      status: 'created',
      mentor_id: body.session_config?.mentor_id,
      patient_id: body.session_config?.patient_id,
      planned_duration: body.session_config?.planned_duration,
      created_at: new Date().toISOString(),
      scheduled_start_time: body.session_config?.scheduled_start_time,
      session_type: body.session_config?.session_type,
    };
    mockSessions.unshift(newSession); // Add to beginning of array
    
    return HttpResponse.json(response, { status: 201 });
  }),

  // GET /api/v1/sessions/:sessionId/join-token
  http.get(`${API_BASE_URL}/sessions/:sessionId/join-token`, async ({ params, request }) => {
    await delay(300);
    const { sessionId } = params;
    const url = new URL(request.url);
    const deviceInfo = url.searchParams.get('device_info');
    
    // Check for auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const response: JoinSessionResponse = {
      join_token: generateJoinToken(),
      session_metadata: {
        session_id: sessionId as string,
        booking_id: `booking-${sessionId}`,
      },
      technical_config: {
        video_codec: 'vp8',
        audio_codec: 'opus',
        ...(deviceInfo ? JSON.parse(deviceInfo) : {}),
      },
      participant_role: 'mentor', // Default, can be determined from token
      session_features: {
        recording_enabled: true,
        transcription_enabled: true,
      },
    };
    
    return HttpResponse.json(response);
  }),

  // POST /api/v1/sessions/:sessionId/start
  http.post(`${API_BASE_URL}/sessions/:sessionId/start`, async ({ params, request }) => {
    await delay(250);
    const { sessionId } = params;
    const body = await request.json() as { session_goals?: string[] };
    
    const response: SessionStartResponse = {
      session_started: true,
      start_timestamp: new Date().toISOString(),
      recording_status: {
        status: 'active',
        recording_id: `recording-${sessionId}`,
      },
      transcription_status: {
        status: 'active',
        transcription_id: `transcription-${sessionId}`,
      },
      ai_monitoring_status: {
        status: 'active',
        insights_enabled: true,
      },
      session_timer: {
        started_at: new Date().toISOString(),
        duration: 0,
      },
    };
    
    return HttpResponse.json(response);
  }),

  // POST /api/v1/sessions/:sessionId/end
  http.post(`${API_BASE_URL}/sessions/:sessionId/end`, async ({ params, request }) => {
    await delay(300);
    const { sessionId } = params;
    const body = await request.json() as {
      ended_by: string;
      end_reason: string;
      session_summary?: Record<string, any>;
    };
    
    const response: SessionEndResponse = {
      session_ended: true,
      end_timestamp: new Date().toISOString(),
      session_duration: 1800, // 30 minutes in seconds
      recording_ids: [`recording-${sessionId}`],
      transcript_id: `transcript-${sessionId}`,
      billing_summary_pointer: `billing-${sessionId}`,
      post_session_task_ids: [`task-1-${sessionId}`, `task-2-${sessionId}`],
    };
    
    return HttpResponse.json(response);
  }),

  // POST /api/v1/sessions/:sessionId/emergency-terminate
  http.post(`${API_BASE_URL}/sessions/:sessionId/emergency-terminate`, async ({ params, request }) => {
    await delay(200);
    const { sessionId } = params;
    const body = await request.json() as {
      terminated_by: string;
      emergency_reason: string;
      emergency_notes?: string;
    };
    
    const response: EmergencyTerminationResponse = {
      session_terminated: true,
      termination_timestamp: new Date().toISOString(),
      emergency_incident_id: `incident-${sessionId}-${Date.now()}`,
      follow_up_procedures: [
        {
          action: 'notify_emergency_contacts',
          status: 'pending',
        },
      ],
      recording_preserved: true,
      notification_sent: true,
    };
    
    return HttpResponse.json(response);
  }),

  // GET /api/v1/sessions/:sessionId/status
  http.get(`${API_BASE_URL}/sessions/:sessionId/status`, async ({ params, request }) => {
    await delay(150);
    const { sessionId } = params;
    const url = new URL(request.url);
    const detailLevel = url.searchParams.get('detail_level') || 'basic';
    
    // Check if session exists
    const session = mockSessions.find((s) => s.session_id === sessionId);
    if (!session) {
      return HttpResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    const response: SessionStatusResponse = {
      status: session.status, // Use actual session status
      participants: [
        {
          id: session.mentor_id || 'mentor-1',
          role: 'mentor',
          display_name: 'Dr. Smith',
        },
        {
          id: session.patient_id || 'patient-1',
          role: 'patient',
          display_name: 'John Doe',
        },
      ],
    };
    
    return HttpResponse.json(response);
  }),

  // POST /api/v1/sessions/:sessionId/recording
  http.post(`${API_BASE_URL}/sessions/:sessionId/recording`, async ({ params, request }) => {
    await delay(250);
    const { sessionId } = params;
    const body = await request.json() as {
      recording_consent: boolean;
      recording_settings?: Record<string, any>;
    };
    
    const response: RecordingConfigurationResponse = {
      recording_configured: true,
      recording_id: `recording-${sessionId}`,
      storage_location: `s3://recordings/${sessionId}`,
      estimated_file_size: 50000000, // 50MB
      retention_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      access_permissions: {
        mentor: ['view', 'download'],
        patient: ['view'],
      },
    };
    
    return HttpResponse.json(response);
  }),

  // GET /api/v1/recordings/:recordingId
  http.get(`${API_BASE_URL}/recordings/:recordingId`, async ({ params, request }) => {
    await delay(200);
    const { recordingId } = params;
    const url = new URL(request.url);
    const requestingUserId = url.searchParams.get('requesting_user_id');
    const accessPurpose = url.searchParams.get('access_purpose') || 'review';
    
    const response: RecordingAccessResponse = {
      access_url: `https://recordings.example.com/${recordingId}?token=access-token`,
      access_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      recording_metadata: {
        duration: 1800,
        file_size: 50000000,
        created_at: new Date().toISOString(),
      },
      streaming_options: {
        hls_url: `https://stream.example.com/${recordingId}/hls.m3u8`,
      },
      download_options: {
        download_url: `https://download.example.com/${recordingId}`,
      },
      transcript_available: true,
    };
    
    return HttpResponse.json(response);
  }),

  // POST /api/v1/sessions/:sessionId/transcription/configure
  http.post(`${API_BASE_URL}/sessions/:sessionId/transcription/configure`, async ({ params, request }) => {
    await delay(200);
    const { sessionId } = params;
    const body = await request.json() as {
      transcription_config?: Record<string, any>;
      consent_flags?: Record<string, any>;
    };
    
    const response = {
      status: 'configured',
      message: 'Transcription configured successfully',
      transcription_id: `transcription-${sessionId}`,
    };
    
    return HttpResponse.json(response);
  }),
];


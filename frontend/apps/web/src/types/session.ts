/**
 * TypeScript types for Session Management
 */

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface SessionCreationRequest {
  booking_id: string;
  session_config: {
    mentor_id?: string;
    patient_id?: string;
    scheduled_start_time?: string;
    planned_duration?: number;
    session_type?: string;
    realtime_transcription_enabled?: boolean;
    ai_provider?: string;
    realtime_insights_enabled?: boolean;
    crisis_monitoring_enabled?: boolean;
    [key: string]: any;
  };
  recording_preferences: {
    recording_enabled?: boolean;
    [key: string]: any;
  };
  emergency_contacts?: EmergencyContact[];
}

export interface SessionCreationResponse {
  session_id: string;
  session_room: Record<string, any>;
  join_tokens: Record<string, any>;
  session_metadata_pointer: string;
  estimated_duration: number;
}

export interface JoinSessionResponse {
  join_token: string;
  session_metadata: Record<string, any>;
  technical_config: Record<string, any>;
  participant_role: 'mentor' | 'patient';
  session_features?: Record<string, any>;
  emergency_controls?: Record<string, any>;
}

export interface SessionStartResponse {
  session_started: boolean;
  start_timestamp: string;
  recording_status?: Record<string, any>;
  transcription_status?: Record<string, any>;
  ai_monitoring_status?: Record<string, any>;
  session_timer?: Record<string, any>;
}

export interface SessionEndResponse {
  session_ended: boolean;
  end_timestamp: string;
  session_duration: number;
  recording_ids?: string[];
  transcript_id?: string;
  billing_summary_pointer?: string;
  post_session_task_ids?: string[];
}

export interface SessionStatusResponse {
  status?: string;
  participants?: Participant[];
}

export interface Participant {
  id: string;
  role: string;
  display_name?: string;
}

export interface RecordingConfiguration {
  recording_consent: boolean;
  recording_settings: Record<string, any>;
  retention_policy: Record<string, any>;
  access_permissions?: Record<string, any>;
  storage_location?: string;
  estimated_file_size?: number;
}

export interface RecordingConfigurationResponse {
  recording_configured: boolean;
  recording_id: string;
  storage_location?: string;
  estimated_file_size?: number;
  retention_expires_at?: string;
  access_permissions?: Record<string, any>;
}

export interface RecordingAccessResponse {
  access_url: string;
  access_expires_at: string;
  recording_metadata?: Record<string, any>;
  streaming_options?: Record<string, any>;
  download_options?: Record<string, any>;
  transcript_available?: boolean;
}

export interface RealtimeTranscriptionConfig {
  transcription_config: {
    ai_provider?: string;
    model?: string;
    speaker_diarization?: boolean;
    target_latency_ms?: number;
    language_preference?: string;
  };
  consent_flags: {
    phi_processing_consent?: boolean;
    real_time_insights_consent?: boolean;
    audio_streaming_consent?: boolean;
  };
}

export interface EmergencyTerminateRequest {
  terminated_by: string;
  emergency_reason: 'safety_concern' | 'medical_emergency' | 'inappropriate_content' | 'technical_failure';
  emergency_notes?: string;
}

export interface EmergencyTerminationResponse {
  session_terminated: boolean;
  termination_timestamp: string;
  emergency_incident_id: string;
  follow_up_procedures?: Array<Record<string, any>>;
  recording_preserved?: boolean;
  notification_sent?: boolean;
}

export interface SessionListItem {
  session_id: string;
  status: 'created' | 'started' | 'ended';
  mentor_id?: string;
  patient_id?: string;
  planned_duration?: number;
  created_at?: string;
  scheduled_start_time?: string;
  session_type?: string;
}

export interface SessionListResponse {
  sessions: SessionListItem[];
  total: number;
  page?: number;
  page_size?: number;
}






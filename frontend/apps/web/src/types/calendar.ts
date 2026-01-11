export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    status: string;
    mentee_name: string;
    mentee_email: string;
    mentee_goal?: string;
    mentee_questions?: string;
    duration_minutes?: number;
    livekit_room_name?: string;
    session_id?: string;
  };
}

export interface AvailabilitySlot {
  id: string;
  mentor_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss
  timezone: string;
  is_recurring: boolean;
  valid_from: string | null; // YYYY-MM-DD
  valid_until: string | null; // YYYY-MM-DD
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  session_id: string | null;
  read_at: string | null;
  created_at: string;
  session?: {
    id: string;
    scheduled_time: string | null;
    status: string;
  } | null;
}

export interface NotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  push_enabled: boolean;
  notify_24h_before: boolean;
  notify_1h_before: boolean;
  notify_15min_before: boolean;
  notify_5min_before: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface CalendarEventsResponse {
  events: CalendarEvent[];
  total: number;
}

export interface AvailabilitySlotsResponse {
  slots: AvailabilitySlot[];
  total: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  limit: number;
  offset: number;
}

export interface AvailabilityCheckResponse {
  is_available: boolean;
  has_availability_slot: boolean;
  has_conflict: boolean;
  conflicting_sessions: string[];
}

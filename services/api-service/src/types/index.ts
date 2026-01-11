export type UserRole = 'MENTOR' | 'MENTEE';

export type SessionStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'ACTIVE'
  | 'ENDED'
  | 'CANCELED';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: SessionStatus;
  scheduled_time: Date;
  start_time?: Date;
  end_time?: Date;
  duration_minutes?: number;
  mentee_goal?: string;
  mentee_questions?: string;
  livekit_room_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
  };
}

export interface CreateSessionRequest {
  mentor_id: string;
  mentee_id: string;
  mentee_goal: string; // Required, max 500 chars
  mentee_questions: string; // Required, max 1000 chars
  scheduled_time: string; // ISO timestamp
}

export interface CreateSessionResponse {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: SessionStatus;
  scheduled_time: string;
  mentee_goal: string;
  mentee_questions: string;
  livekit_room_name: string;
  created_at: string;
  updated_at: string;
}


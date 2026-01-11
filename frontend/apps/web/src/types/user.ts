/**
 * User types for authentication and profiles
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  full_name: string;
  role: 'mentor' | 'mentee' | 'admin' | 'MENTOR' | 'MENTEE'; // Support both formats for compatibility
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: 'mentor' | 'mentee';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserUpdateRequest {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface PasswordUpdateRequest {
  old_password: string;
  new_password: string;
}

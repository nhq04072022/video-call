export type UserRole = 'MENTOR' | 'MENTEE';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
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


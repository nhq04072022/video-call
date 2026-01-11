/**
 * Authentication API service
 * Integrated with backend API at /api/auth
 */
import axios from 'axios';
import type { AuthResponse, RegisterRequest } from '../types/user';

// API base URL (matches backend service)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Backend response format
interface BackendAuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: 'MENTOR' | 'MENTEE';
  };
}

// Create axios instance for auth (without token interceptor)
const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to convert backend role to frontend role
const convertRole = (role: 'MENTOR' | 'MENTEE'): 'mentor' | 'mentee' => {
  return role.toLowerCase() as 'mentor' | 'mentee';
};

// Helper to convert backend response to frontend format
const convertAuthResponse = (backendResponse: BackendAuthResponse): AuthResponse => {
  return {
    access_token: backendResponse.token,
    token_type: 'Bearer',
    user: {
      id: backendResponse.user.id,
      email: backendResponse.user.email,
      full_name: backendResponse.user.full_name,
      name: backendResponse.user.full_name,
      role: convertRole(backendResponse.user.role),
      is_active: true,
      is_email_verified: false,
    },
  };
};

export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await authClient.post<BackendAuthResponse>('/api/auth/register', {
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      role: data.role.toUpperCase() as 'MENTOR' | 'MENTEE',
    });
    return convertAuthResponse(response.data);
  },

  /**
   * Login with email and password
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await authClient.post<BackendAuthResponse>('/api/auth/login', {
      email,
      password,
    });
    return convertAuthResponse(response.data);
  },

  /**
   * Logout (clear token on server if needed)
   */
  logout: async (): Promise<void> => {
    // Client-side logout, clear token from storage
    // Server-side logout can be added if needed
  },
};


/**
 * User API service
 */
import axios from 'axios';
import type { User, UserUpdateRequest, PasswordUpdateRequest } from '../types/user';
import { useAuthStore } from '../stores/authStore';

// API base URL (matches backend service)
// ⚠️ NOTE: User endpoints are NOT yet implemented in backend
// Backend currently only has: /api/auth and /api/sessions
// These endpoints will return 404 until backend implements them
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const userClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
userClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

userClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const userApi = {
  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<User> => {
    // Try /api/users/me first, fallback to /api/v1/users/me for compatibility
    try {
      const response = await userClient.get<User>('/api/users/me');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Fallback to v1 endpoint
    const response = await userClient.get<User>('/api/v1/users/me');
    return response.data;
      }
      throw error;
    }
  },

  /**
   * Update current user profile
   */
  updateCurrentUser: async (data: UserUpdateRequest): Promise<User> => {
    try {
      const response = await userClient.put<User>('/api/users/me', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
    const response = await userClient.put<User>('/api/v1/users/me', data);
    return response.data;
      }
      throw error;
    }
  },

  /**
   * Update password
   */
  updatePassword: async (data: PasswordUpdateRequest): Promise<void> => {
    try {
      await userClient.put('/api/users/me/password', data);
    } catch (error: any) {
      if (error.response?.status === 404) {
    await userClient.put('/api/v1/users/me/password', data);
      } else {
        throw error;
      }
    }
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId: string): Promise<User> => {
    try {
      const response = await userClient.get<User>(`/api/users/${userId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
    const response = await userClient.get<User>(`/api/v1/users/${userId}`);
    return response.data;
      }
      throw error;
    }
  },
};


import axios from 'axios';
import type {
  NotificationsResponse,
  NotificationPreferences,
} from '../types/calendar';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
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

export const notificationApi = {
  /**
   * Get user notifications
   */
  getNotifications: async (
    unreadOnly: boolean = false,
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationsResponse> => {
    const response = await apiClient.get<NotificationsResponse>('/api/notifications', {
      params: {
        unread_only: unreadOnly,
        limit,
        offset,
      },
    });
    return response.data;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (notificationId: string): Promise<{ success: boolean; notification_id: string; read_at: string }> => {
    const response = await apiClient.put(`/api/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ success: boolean; message: string; updated_count: number }> => {
    const response = await apiClient.put('/api/notifications/read-all');
    return response.data;
  },

  /**
   * Get notification preferences
   */
  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await apiClient.get<NotificationPreferences>('/api/notifications/preferences');
    return response.data;
  },

  /**
   * Update notification preferences
   */
  updatePreferences: async (
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> => {
    const response = await apiClient.put<NotificationPreferences>(
      '/api/notifications/preferences',
      preferences
    );
    return response.data;
  },
};

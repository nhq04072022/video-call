import axios from 'axios';
import type {
  CalendarEvent,
  CalendarEventsResponse,
  AvailabilitySlot,
  AvailabilitySlotsResponse,
  AvailabilityCheckResponse,
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

export const calendarApi = {
  /**
   * Get calendar events for date range
   */
  getCalendarEvents: async (
    start: string,
    end: string,
    view?: string
  ): Promise<CalendarEventsResponse> => {
    const response = await apiClient.get<CalendarEventsResponse>('/api/mentors/me/calendar', {
      params: {
        start_date: start,
        end_date: end,
        view,
      },
    });
    return response.data;
  },

  /**
   * Get events in FullCalendar format
   */
  getCalendarEventsForFullCalendar: async (
    start: string,
    end: string
  ): Promise<CalendarEvent[]> => {
    const response = await apiClient.get<CalendarEvent[]>('/api/mentors/me/calendar/events', {
      params: {
        start,
        end,
      },
    });
    return response.data;
  },

  /**
   * Get all availability slots for the current mentor
   */
  getAvailabilitySlots: async (): Promise<AvailabilitySlotsResponse> => {
    const response = await apiClient.get<AvailabilitySlotsResponse>('/api/mentors/me/availability');
    return response.data;
  },

  /**
   * Create a new availability slot
   */
  createAvailabilitySlot: async (data: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    timezone?: string;
    is_recurring?: boolean;
    valid_from?: string;
    valid_until?: string;
    is_active?: boolean;
  }): Promise<AvailabilitySlot> => {
    const response = await apiClient.post<AvailabilitySlot>('/api/mentors/me/availability', data);
    return response.data;
  },

  /**
   * Update an availability slot
   */
  updateAvailabilitySlot: async (
    slotId: string,
    data: Partial<{
      day_of_week: number;
      start_time: string;
      end_time: string;
      timezone: string;
      is_recurring: boolean;
      valid_from: string | null;
      valid_until: string | null;
      is_active: boolean;
    }>
  ): Promise<AvailabilitySlot> => {
    const response = await apiClient.put<AvailabilitySlot>(
      `/api/mentors/me/availability/${slotId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete an availability slot
   */
  deleteAvailabilitySlot: async (slotId: string): Promise<void> => {
    await apiClient.delete(`/api/mentors/me/availability/${slotId}`);
  },

  /**
   * Check if a time slot is available
   */
  checkAvailability: async (
    startTime: string,
    endTime: string
  ): Promise<AvailabilityCheckResponse> => {
    const response = await apiClient.get<AvailabilityCheckResponse>(
      '/api/mentors/me/availability/check',
      {
        params: {
          start_time: startTime,
          end_time: endTime,
        },
      }
    );
    return response.data;
  },
};

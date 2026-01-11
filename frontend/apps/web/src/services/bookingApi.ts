/**
 * Booking API service
 */
import axios from 'axios';
import type {
  Booking,
  BookingCreateRequest,
  BookingCancelRequest,
  AvailableSlotsResponse,
} from '../types/booking';
import { useAuthStore } from '../stores/authStore';

// API base URL (matches backend service)
// ⚠️ NOTE: Booking endpoints are NOT yet implemented in backend
// Backend currently only has: /api/auth and /api/sessions
// These endpoints will return 404 until backend implements them
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const bookingClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
bookingClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

bookingClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const bookingApi = {
  /**
   * List bookings for current user
   */
  listBookings: async (status?: string): Promise<Booking[]> => {
    // ⚠️ Backend endpoint not implemented yet - will return 404
    const params = status ? { status } : {};
    const response = await bookingClient.get<Booking[]>('/api/v1/bookings', { params });
    return response.data;
  },

  /**
   * Get booking by ID
   */
  getBookingById: async (bookingId: string): Promise<Booking> => {
    const response = await bookingClient.get<Booking>(`/api/v1/bookings/${bookingId}`);
    return response.data;
  },

  /**
   * Create a new booking
   */
  createBooking: async (data: BookingCreateRequest): Promise<Booking> => {
    const response = await bookingClient.post<Booking>('/api/v1/bookings', data);
    return response.data;
  },

  /**
   * Confirm a booking (mentor only)
   */
  confirmBooking: async (bookingId: string): Promise<Booking> => {
    const response = await bookingClient.post<Booking>(`/api/v1/bookings/${bookingId}/confirm`);
    return response.data;
  },

  /**
   * Cancel a booking
   */
  cancelBooking: async (bookingId: string, data: BookingCancelRequest): Promise<Booking> => {
    const response = await bookingClient.post<Booking>(`/api/v1/bookings/${bookingId}/cancel`, data);
    return response.data;
  },

  /**
   * Get available time slots for a mentor
   */
  getAvailableSlots: async (
    mentorId: string,
    startDate: string,
    endDate: string,
    durationMinutes: number = 60
  ): Promise<AvailableSlotsResponse> => {
    const params = {
      start_date: startDate,
      end_date: endDate,
      duration_minutes: durationMinutes.toString(),
    };
    const response = await bookingClient.get<AvailableSlotsResponse>(
      `/api/v1/bookings/mentors/${mentorId}/available-slots`,
      { params }
    );
    return response.data;
  },
};


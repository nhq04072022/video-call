/**
 * Review API service
 */
import axios from 'axios';
import type {
  Review,
  ReviewListResponse,
  ReviewCreateRequest,
  ReviewUpdateRequest,
} from '../types/review';
import { useAuthStore } from '../stores/authStore';

// API base URL (matches backend service)
// ⚠️ NOTE: Review endpoints are NOT yet implemented in backend
// Backend currently only has: /api/auth and /api/sessions
// These endpoints will return 404 until backend implements them
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const reviewClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
reviewClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

reviewClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const reviewApi = {
  /**
   * Get reviews for a mentor
   */
  getMentorReviews: async (mentorId: string, limit: number = 50, offset: number = 0): Promise<ReviewListResponse> => {
    const params = { limit: limit.toString(), offset: offset.toString() };
    const response = await reviewClient.get<ReviewListResponse>(`/api/v1/mentors/${mentorId}/reviews`, { params });
    return response.data;
  },

  /**
   * Create a review for a booking
   */
  createReview: async (bookingId: string, data: ReviewCreateRequest): Promise<Review> => {
    const response = await reviewClient.post<Review>(`/api/v1/bookings/${bookingId}/review`, data);
    return response.data;
  },

  /**
   * Update a review
   */
  updateReview: async (reviewId: string, data: ReviewUpdateRequest): Promise<Review> => {
    const response = await reviewClient.put<Review>(`/api/v1/reviews/${reviewId}`, data);
    return response.data;
  },

  /**
   * Delete a review
   */
  deleteReview: async (reviewId: string): Promise<void> => {
    await reviewClient.delete(`/api/v1/reviews/${reviewId}`);
  },

  /**
   * Get review by ID
   */
  getReviewById: async (reviewId: string): Promise<Review> => {
    const response = await reviewClient.get<Review>(`/api/v1/reviews/${reviewId}`);
    return response.data;
  },
};


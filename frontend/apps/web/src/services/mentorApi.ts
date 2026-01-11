/**
 * Mentor API service
 */
import axios from 'axios';
import type {
  Mentor,
  MentorListResponse,
  MentorCreateRequest,
  MentorUpdateRequest,
  ExpertiseArea,
  AvailabilitySlot,
  AvailabilitySlotCreateRequest,
  MentorSearchFilters,
} from '../types/mentor';
import { useAuthStore } from '../stores/authStore';

// API base URL (matches backend service)
// ⚠️ NOTE: Mentor endpoints are NOT yet implemented in backend
// Backend currently only has: /api/auth and /api/sessions
// These endpoints will return 404 until backend implements them
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const mentorClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
mentorClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

mentorClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const mentorApi = {
  /**
   * Search/list mentors with filters
   */
  searchMentors: async (filters: MentorSearchFilters = {}): Promise<MentorListResponse> => {
    const params = new URLSearchParams();
    if (filters.expertise_ids) {
      filters.expertise_ids.forEach(id => params.append('expertise_ids', id));
    }
    if (filters.min_price !== undefined) params.append('min_price', filters.min_price.toString());
    if (filters.max_price !== undefined) params.append('max_price', filters.max_price.toString());
    if (filters.min_rating !== undefined) params.append('min_rating', filters.min_rating.toString());
    if (filters.is_available !== undefined) params.append('is_available', filters.is_available.toString());
    params.append('limit', (filters.limit || 20).toString());
    params.append('offset', (filters.offset || 0).toString());

    try {
      const response = await mentorClient.get<MentorListResponse>('/api/mentors', { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
    const response = await mentorClient.get<MentorListResponse>('/api/v1/mentors', { params });
    return response.data;
      }
      throw error;
    }
  },

  /**
   * Get mentor by ID
   */
  getMentorById: async (mentorId: string): Promise<Mentor> => {
    try {
      const response = await mentorClient.get<Mentor>(`/api/mentors/${mentorId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
    const response = await mentorClient.get<Mentor>(`/api/v1/mentors/${mentorId}`);
    return response.data;
      }
      throw error;
    }
  },

  /**
   * Create mentor profile
   */
  createMentor: async (data: MentorCreateRequest): Promise<Mentor> => {
    const response = await mentorClient.post<Mentor>('/api/v1/mentors', data);
    return response.data;
  },

  /**
   * Update mentor profile
   */
  updateMentor: async (mentorId: string, data: MentorUpdateRequest): Promise<Mentor> => {
    const response = await mentorClient.put<Mentor>(`/api/v1/mentors/${mentorId}`, data);
    return response.data;
  },

  /**
   * Get all expertise areas
   */
  getExpertiseAreas: async (category?: string): Promise<ExpertiseArea[]> => {
    const params = category ? { category } : {};
    const response = await mentorClient.get<ExpertiseArea[]>('/api/v1/expertise', { params });
    return response.data;
  },

  /**
   * Get expertise area by ID
   */
  getExpertiseById: async (expertiseId: string): Promise<ExpertiseArea> => {
    const response = await mentorClient.get<ExpertiseArea>(`/api/v1/expertise/${expertiseId}`);
    return response.data;
  },

  /**
   * Get mentor availability slots
   */
  getMentorAvailability: async (mentorId: string): Promise<AvailabilitySlot[]> => {
    const response = await mentorClient.get<AvailabilitySlot[]>(`/api/v1/mentors/${mentorId}/availability`);
    return response.data;
  },

  /**
   * Create availability slot
   */
  createAvailabilitySlot: async (mentorId: string, data: AvailabilitySlotCreateRequest): Promise<AvailabilitySlot> => {
    const response = await mentorClient.post<AvailabilitySlot>(`/api/v1/mentors/${mentorId}/availability`, data);
    return response.data;
  },

  /**
   * Update availability slot
   */
  updateAvailabilitySlot: async (
    mentorId: string,
    slotId: string,
    data: Partial<AvailabilitySlotCreateRequest>
  ): Promise<AvailabilitySlot> => {
    const response = await mentorClient.put<AvailabilitySlot>(
      `/api/v1/mentors/${mentorId}/availability/${slotId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete availability slot
   */
  deleteAvailabilitySlot: async (mentorId: string, slotId: string): Promise<void> => {
    await mentorClient.delete(`/api/v1/mentors/${mentorId}/availability/${slotId}`);
  },
};


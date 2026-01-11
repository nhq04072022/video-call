/**
 * Mentor and expertise types
 */
export interface ExpertiseArea {
  expertise_id: string;
  name: string;
  description?: string;
  category?: string;
  icon_url?: string;
  proficiency_level?: string;
  years_in_expertise?: number;
}

export interface MentorExpertise {
  expertise_id: string;
  proficiency_level: string;
  years_in_expertise?: number;
  name?: string;
}

export interface Mentor {
  id: string;
  bio?: string;
  hourly_rate?: number;
  years_of_experience?: number;
  languages: string[];
  profile_image_url?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  is_available: boolean;
  average_rating: number;
  total_reviews: number;
  total_sessions_completed: number;
  expertise_areas: MentorExpertise[];
  created_at?: string;
  updated_at?: string;
}

export interface MentorListResponse {
  mentors: Mentor[];
  total: number;
  limit: number;
  offset: number;
}

export interface MentorCreateRequest {
  bio?: string;
  hourly_rate: number;
  years_of_experience?: number;
  languages?: string[];
  profile_image_url?: string;
}

export interface MentorUpdateRequest {
  bio?: string;
  hourly_rate?: number;
  years_of_experience?: number;
  languages?: string[];
  profile_image_url?: string;
  is_available?: boolean;
}

export interface AvailabilitySlot {
  slot_id: string;
  mentor_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  start_time: string;
  end_time: string;
  timezone: string;
  is_recurring: boolean;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  created_at?: string;
}

export interface AvailabilitySlotCreateRequest {
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone?: string;
  is_recurring?: boolean;
  valid_from?: string;
  valid_until?: string;
}

export interface MentorSearchFilters {
  expertise_ids?: string[];
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  is_available?: boolean;
  limit?: number;
  offset?: number;
}


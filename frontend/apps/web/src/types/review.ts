/**
 * Review and rating types
 */
export interface Review {
  id: string;
  booking_id: string;
  mentor_id: string;
  mentee_id: string;
  session_id?: string;
  rating: number; // 1-5
  comment?: string;
  is_public: boolean;
  communication_rating?: number; // 1-5
  expertise_rating?: number; // 1-5
  helpfulness_rating?: number; // 1-5
  created_at?: string;
  updated_at?: string;
}

export interface ReviewListResponse {
  reviews: Review[];
  total: number;
  limit: number;
  offset: number;
}

export interface ReviewCreateRequest {
  booking_id: string;
  rating: number; // 1-5
  comment?: string;
  communication_rating?: number;
  expertise_rating?: number;
  helpfulness_rating?: number;
}

export interface ReviewUpdateRequest {
  rating?: number;
  comment?: string;
  communication_rating?: number;
  expertise_rating?: number;
  helpfulness_rating?: number;
}


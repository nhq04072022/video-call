/**
 * Booking types
 */
export interface Booking {
  id: string;
  mentor_id: string;
  mentee_id: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  meeting_link?: string;
  notes?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BookingCreateRequest {
  mentor_id: string;
  scheduled_start_time: string; // ISO datetime string
  duration_minutes: number;
  notes?: string;
}

export interface BookingCancelRequest {
  reason?: string;
}

export interface AvailableSlot {
  start_time: string; // ISO datetime string
  end_time: string; // ISO datetime string
  duration_minutes: number;
}

export interface AvailableSlotsResponse {
  slots: AvailableSlot[];
}


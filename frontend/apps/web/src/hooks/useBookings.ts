/**
 * Custom hook for booking data management
 */
import { useState, useEffect, useCallback } from 'react';
import { bookingApi } from '../services/bookingApi';
import type { Booking, AvailableSlot } from '../types/booking';

export const useBookings = (status?: string) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingApi.listBookings(status);
      setBookings(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  return { bookings, loading, error, refresh: loadBookings };
};

export const useBooking = (bookingId: string | null) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) {
      setBooking(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await bookingApi.getBookingById(bookingId);
      setBooking(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load booking');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  return { booking, loading, error, refetch: fetchBooking };
};

export const useAvailability = (mentorId: string | null, startDate: string, endDate: string, durationMinutes: number = 60) => {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mentorId) {
      setSlots([]);
      return;
    }

    const fetchAvailability = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await bookingApi.getAvailableSlots(mentorId, startDate, endDate, durationMinutes);
        setSlots(response.slots);
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to load availability');
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [mentorId, startDate, endDate, durationMinutes]);

  return { slots, loading, error };
};


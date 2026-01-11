/**
 * Booking Page - Create booking with mentor
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMentor } from '../hooks/useMentors';
import { useAvailability } from '../hooks/useBookings';
import { bookingApi } from '../services/bookingApi';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const BookingPage: React.FC = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();
  const { mentor, loading: mentorLoading } = useMentor(mentorId || null);
  
  // Get availability for next 30 days
  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { slots, loading: slotsLoading } = useAvailability(mentorId || null, startDate, endDate, 60);
  
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSlotSelect = (slotStart: string) => {
    setSelectedSlot(slotStart);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !mentorId) return;

    setSubmitting(true);
    setError(null);

    try {
      const slot = slots?.find(s => s.start_time === selectedSlot);
      if (!slot) {
        throw new Error('Selected slot not found');
      }

      const booking = await bookingApi.createBooking({
        mentor_id: mentorId,
        scheduled_start_time: slot.start_time,
        duration_minutes: duration,
        notes: notes || undefined,
      });

      navigate(`/bookings/${booking.id}/confirmation`);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (mentorLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Mentor not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button onClick={() => navigate(`/mentors/${mentorId}`)} variant="outline" className="mb-6">
        ← Back to Mentor Profile
      </Button>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-text-grey mb-2">Book a Session</h1>
        <p className="text-text-grey/70 mb-8">Select a time slot for your session with this mentor</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Duration Selection */}
          <div className="mb-6">
            <label htmlFor="duration" className="block text-sm font-semibold text-text-grey mb-2">
              Duration (minutes)
            </label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-purple"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </div>

          {/* Available Time Slots */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-text-grey mb-4">
              Select Time Slot
            </label>
            {slotsLoading ? (
              <div className="text-center py-8">Loading available slots...</div>
            ) : !slots || slots.length === 0 ? (
              <div className="text-center py-8 text-text-grey/70">
                No available slots in the next 30 days
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {slots && slots.map((slot, idx) => {
                  const slotDate = new Date(slot.start_time);
                  const isSelected = selectedSlot === slot.start_time;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSlotSelect(slot.start_time)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'border-primary-purple bg-purple-50'
                          : 'border-gray-200 hover:border-primary-purple/50'
                      } focus:outline-none focus:ring-2 focus:ring-primary-purple`}
                    >
                      <div className="font-semibold text-text-grey">
                        {slotDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-sm text-text-grey/70">
                        {slotDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-semibold text-text-grey mb-2">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-purple"
              placeholder="Any specific topics or questions you'd like to discuss..."
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={!selectedSlot || submitting}
              aria-label="Confirm booking"
            >
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/mentors/${mentorId}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};


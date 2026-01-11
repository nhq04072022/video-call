/**
 * Booking Confirmation Page
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBooking } from '../hooks/useBookings';
import { Button } from '../components/ui/Button';

export const BookingConfirmationPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { booking, loading, error } = useBooking(bookingId || null);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error || 'Booking not found'}
        </div>
      </div>
    );
  }

  const startTime = new Date(booking.scheduled_start_time);
  const endTime = new Date(booking.scheduled_end_time);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-text-grey mb-2">Booking Confirmed!</h1>
          <p className="text-text-grey/70">Your session has been successfully booked</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
          <div className="space-y-3">
            <div>
              <div className="text-sm text-text-grey/70">Session Date & Time</div>
              <div className="font-semibold text-text-grey">
                {startTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <div className="text-text-grey">
                {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} -{' '}
                {endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </div>
            </div>
            <div>
              <div className="text-sm text-text-grey/70">Duration</div>
              <div className="font-semibold text-text-grey">{booking.duration_minutes} minutes</div>
            </div>
            <div>
              <div className="text-sm text-text-grey/70">Status</div>
              <div className="font-semibold text-text-grey capitalize">{booking.status}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate('/bookings')} aria-label="View all bookings">
            View My Bookings
          </Button>
          <Button onClick={() => navigate('/mentors')} variant="outline" aria-label="Find more mentors">
            Find More Mentors
          </Button>
        </div>
      </div>
    </div>
  );
};


/**
 * Booking Detail Page
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBooking } from '../hooks/useBookings';
import { bookingApi } from '../services/bookingApi';
import { sessionApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import { Button } from '../components/ui/Button';

export const BookingDetailPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { booking, loading, error, refetch } = useBooking(bookingId || null);
  const [cancelling, setCancelling] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [creatingSession, setCreatingSession] = React.useState(false);
  const user = useAuthStore((state) => state.user);

  const handleConfirm = async () => {
    if (!bookingId || !window.confirm('Confirm this booking?')) {
      return;
    }

    setConfirming(true);
    try {
      await bookingApi.confirmBooking(bookingId);
      await refetch?.(); // Refresh booking data
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to confirm booking');
    } finally {
      setConfirming(false);
    }
  };

  const setCurrentSessionId = useSessionStore((state) => state.setCurrentSessionId);
  
  const handleStartSession = async () => {
    if (!bookingId || !window.confirm('Start a session for this booking? You will join automatically and receive a code to share.')) {
      return;
    }

    setCreatingSession(true);
    try {
      // Create session
      const session = await sessionApi.createSessionFromBooking(bookingId);
      // Store session ID in store
      setCurrentSessionId(session.session_id);
      // Navigate to share page to show the code
      navigate('/sessions/share');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to start session');
    } finally {
      setCreatingSession(false);
    }
  };

  const handleCancel = async () => {
    if (!bookingId || !window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setCancelling(true);
    try {
      await bookingApi.cancelBooking(bookingId, { reason: 'Cancelled by user' });
      navigate('/bookings');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error || 'Booking not found'}
        </div>
      </div>
    );
  }

  const startTime = new Date(booking.scheduled_start_time);
  const endTime = new Date(booking.scheduled_end_time);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button onClick={() => navigate('/bookings')} variant="outline" className="mb-6">
        ← Back to Bookings
      </Button>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-3xl font-bold text-text-grey">Booking Details</h1>
          <span className={`px-4 py-2 text-sm font-medium rounded-full ${statusColors[booking.status]}`}>
            {booking.status}
          </span>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-text-grey/70 mb-1">Date & Time</h3>
            <p className="text-text-grey">
              {startTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-text-grey">
              {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} -{' '}
              {endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-grey/70 mb-1">Duration</h3>
            <p className="text-text-grey">{booking.duration_minutes} minutes</p>
          </div>

          {booking.notes && (
            <div>
              <h3 className="text-sm font-semibold text-text-grey/70 mb-1">Notes</h3>
              <p className="text-text-grey">{booking.notes}</p>
            </div>
          )}

          {booking.cancellation_reason && (
            <div>
              <h3 className="text-sm font-semibold text-text-grey/70 mb-1">Cancellation Reason</h3>
              <p className="text-text-grey">{booking.cancellation_reason}</p>
            </div>
          )}

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            {booking.status === 'pending' && user?.role === 'mentor' && (
              <Button
                onClick={handleConfirm}
                disabled={confirming}
                aria-label="Confirm booking"
              >
                {confirming ? 'Confirming...' : 'Confirm Booking'}
              </Button>
            )}
            {booking.status === 'confirmed' && user?.role === 'mentor' && !(booking as any).session_id && (
              <Button
                onClick={handleStartSession}
                disabled={creatingSession}
                variant="primary"
                aria-label="Start session"
              >
                {creatingSession ? 'Starting Session...' : 'Start Session'}
              </Button>
            )}
            {booking.status === 'confirmed' && (booking as any).session_id && (
              <Button
                onClick={() => {
                  setCurrentSessionId((booking as any).session_id);
                  navigate('/sessions/join');
                }}
                aria-label="Join session"
              >
                Join Session
              </Button>
            )}
            {booking.status === 'completed' && (
              <Button
                onClick={() => navigate(`/reviews/${booking.id}/create`)}
                variant="outline"
                aria-label="Leave a review"
              >
                Leave a Review
              </Button>
            )}
            {['pending', 'confirmed'].includes(booking.status) && (
              <Button
                onClick={handleCancel}
                variant="danger"
                disabled={cancelling}
                aria-label="Cancel booking"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


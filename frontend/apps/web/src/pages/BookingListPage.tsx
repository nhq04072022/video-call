/**
 * Booking List Page
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookings } from '../hooks/useBookings';
import { Button } from '../components/ui/Button';
import type { Booking } from '../types/booking';

interface BookingCardProps {
  booking: Booking;
  onNavigate: (path: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onNavigate }) => {
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
    <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-text-grey">
              Session with Mentor
            </h3>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[booking.status]}`}>
              {booking.status}
            </span>
          </div>
          <div className="text-text-grey/70 space-y-1">
            <div>
              {startTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div>
              {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} -{' '}
              {endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>
            <div>{booking.duration_minutes} minutes</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => onNavigate(`/bookings/${booking.id}`)}
            variant="outline"
            size="sm"
            aria-label={`View booking ${booking.id} details`}
          >
            View Details
          </Button>
          {booking.status === 'confirmed' && (
            <Button
              onClick={() => onNavigate(`/sessions/${booking.id}/join`)}
              size="sm"
              aria-label={`Join session for booking ${booking.id}`}
            >
              Join Session
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const BookingListPage: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { bookings, loading, error } = useBookings(statusFilter);

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Error loading bookings: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-grey mb-2">My Bookings</h1>
        <p className="text-text-grey/70">Manage your mentoring sessions</p>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <Button
          variant={statusFilter === undefined ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter(undefined)}
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'pending' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('pending')}
        >
          Pending
        </Button>
        <Button
          variant={statusFilter === 'confirmed' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('confirmed')}
        >
          Confirmed
        </Button>
        <Button
          variant={statusFilter === 'completed' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('completed')}
        >
          Completed
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-purple"></div>
          <p className="mt-4 text-text-grey/70">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <p className="text-text-grey/70 mb-4">No bookings found</p>
          <Button onClick={() => navigate('/mentors')} variant="outline">
            Find a Mentor
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} onNavigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
};


/**
 * Review Page - Create/Edit Review
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBooking } from '../hooks/useBookings';
import { reviewApi } from '../services/reviewApi';
import { StarRating } from '../components/features/reviews/StarRating';
import { Button } from '../components/ui/Button';
import type { ReviewCreateRequest } from '../types/review';

export const ReviewPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { booking, loading: bookingLoading } = useBooking(bookingId || null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ReviewCreateRequest>({
    booking_id: bookingId || '',
    rating: 0,
    comment: '',
    communication_rating: undefined,
    expertise_rating: undefined,
    helpfulness_rating: undefined,
  });

  useEffect(() => {
    if (bookingId) {
      setFormData(prev => ({ ...prev, booking_id: bookingId }));
    }
  }, [bookingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await reviewApi.createReview(bookingId!, formData);
      navigate(`/bookings/${bookingId}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (bookingLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Booking not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Button onClick={() => navigate(`/bookings/${bookingId}`)} variant="outline" className="mb-6">
        ← Back to Booking
      </Button>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-text-grey mb-2">Write a Review</h1>
        <p className="text-text-grey/70 mb-8">Share your experience with this mentor</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-semibold text-text-grey mb-3">
              Overall Rating *
            </label>
            <StarRating
              rating={formData.rating}
              onRatingChange={(rating) => setFormData({ ...formData, rating })}
              interactive={true}
              size="lg"
            />
          </div>

          {/* Detailed Ratings */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-text-grey mb-3">Detailed Ratings (Optional)</h3>

            <div>
              <label className="block text-sm text-text-grey/70 mb-2">Communication</label>
              <StarRating
                rating={formData.communication_rating || 0}
                onRatingChange={(rating) => setFormData({ ...formData, communication_rating: rating })}
                interactive={true}
              />
            </div>

            <div>
              <label className="block text-sm text-text-grey/70 mb-2">Expertise</label>
              <StarRating
                rating={formData.expertise_rating || 0}
                onRatingChange={(rating) => setFormData({ ...formData, expertise_rating: rating })}
                interactive={true}
              />
            </div>

            <div>
              <label className="block text-sm text-text-grey/70 mb-2">Helpfulness</label>
              <StarRating
                rating={formData.helpfulness_rating || 0}
                onRatingChange={(rating) => setFormData({ ...formData, helpfulness_rating: rating })}
                interactive={true}
              />
            </div>
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-sm font-semibold text-text-grey mb-2">
              Your Review
            </label>
            <textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-purple"
              placeholder="Share your experience and feedback..."
            />
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <Button type="submit" disabled={submitting || formData.rating === 0}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/bookings/${bookingId}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};


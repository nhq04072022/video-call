/**
 * Review Card Component
 */
import React from 'react';
import { StarRating } from './StarRating';
import type { Review } from '../../../types/review';

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const reviewDate = review.created_at ? new Date(review.created_at) : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-3">
        <StarRating rating={review.rating} interactive={false} />
        {reviewDate && (
          <span className="text-sm text-text-grey/70">
            {reviewDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        )}
      </div>

      {review.comment && (
        <p className="text-text-grey mb-4 leading-relaxed">{review.comment}</p>
      )}

      {(review.communication_rating || review.expertise_rating || review.helpfulness_rating) && (
        <div className="pt-4 border-t border-gray-200 space-y-2 text-sm">
          {review.communication_rating && (
            <div className="flex justify-between">
              <span className="text-text-grey/70">Communication:</span>
              <StarRating rating={review.communication_rating} interactive={false} size="sm" />
            </div>
          )}
          {review.expertise_rating && (
            <div className="flex justify-between">
              <span className="text-text-grey/70">Expertise:</span>
              <StarRating rating={review.expertise_rating} interactive={false} size="sm" />
            </div>
          )}
          {review.helpfulness_rating && (
            <div className="flex justify-between">
              <span className="text-text-grey/70">Helpfulness:</span>
              <StarRating rating={review.helpfulness_rating} interactive={false} size="sm" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};


/**
 * Star Rating Component
 */
import React from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  interactive = false,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, value: number) => {
    if (interactive && onRatingChange && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onRatingChange(value);
    }
  };

  return (
    <div className="flex items-center gap-1" role={interactive ? 'radiogroup' : 'img'} aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => handleClick(value)}
          onKeyDown={(e) => handleKeyDown(e, value)}
          disabled={!interactive}
          className={`${sizeClasses[size]} ${
            interactive
              ? 'cursor-pointer hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary-purple rounded'
              : 'cursor-default'
          }`}
          aria-label={`Rate ${value} out of 5`}
          aria-checked={value === rating}
        >
          {value <= rating ? (
            <span className="text-yellow-500">★</span>
          ) : (
            <span className="text-gray-300">☆</span>
          )}
        </button>
      ))}
      {rating > 0 && <span className="ml-2 text-sm text-text-grey/70">({rating})</span>}
    </div>
  );
};


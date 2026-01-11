/**
 * Mentor Card Component
 */
import React from 'react';
import { Link } from 'react-router-dom';
import type { Mentor } from '../../../types/mentor';

interface MentorCardProps {
  mentor: Mentor;
}

export const MentorCard: React.FC<MentorCardProps> = ({ mentor }) => {
  const expertiseNames = mentor.expertise_areas
    .slice(0, 3)
    .map(ea => ea.name || '')
    .filter(Boolean)
    .join(', ');

  return (
    <Link
      to={`/mentors/${mentor.id}`}
      className="block bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:ring-offset-2"
      aria-label={`View profile of ${mentor.id}`}
    >
      <div className="flex flex-col md:flex-row gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-purple to-primary-purple/70 flex items-center justify-center text-white text-2xl font-semibold">
            {mentor.profile_image_url ? (
              <img
                src={mentor.profile_image_url}
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              mentor.id.charAt(0).toUpperCase()
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-text-grey truncate">
                {(mentor as any).full_name || `Mentor ${mentor.id.slice(0, 8)}`}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center">
                  <span className="text-yellow-500">★</span>
                  <span className="ml-1 text-sm text-text-grey">
                    {mentor.average_rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-text-grey/60">•</span>
                <span className="text-sm text-text-grey">
                  {mentor.total_reviews} reviews
                </span>
              </div>
            </div>
            {mentor.is_available && (
              <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Available
              </span>
            )}
          </div>

          {mentor.bio && (
            <p className="text-sm text-text-grey/80 line-clamp-2 mb-3">
              {mentor.bio}
            </p>
          )}

          {expertiseNames && (
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs text-text-grey/70">Expertise:</span>
              <span className="text-xs text-primary-purple font-medium">
                {expertiseNames}
                {mentor.expertise_areas.length > 3 && ' +more'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <div className="text-lg font-semibold text-primary-purple">
              ${mentor.hourly_rate?.toFixed(2)}/hr
            </div>
            <span className="text-sm text-text-grey/70">
              {mentor.total_sessions_completed} sessions
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};


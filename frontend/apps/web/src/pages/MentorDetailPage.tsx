/**
 * Mentor Detail Page
 */
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMentor } from '../hooks/useMentors';
import { Button } from '../components/ui/Button';
import { mentorApi } from '../services/mentorApi';
import type { ReviewListResponse } from '../types/review';
import { reviewApi } from '../services/reviewApi';
import { useAuthStore } from '../stores/authStore';
import { sessionApi } from '../services/api';

export const MentorDetailPage: React.FC = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();
  const { mentor, loading, error } = useMentor(mentorId || null);
  const [reviews, setReviews] = React.useState<ReviewListResponse | null>(null);
  const [loadingReviews, setLoadingReviews] = React.useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const user = useAuthStore((state) => state.user);

  React.useEffect(() => {
    if (mentorId) {
      const loadReviews = async () => {
        setLoadingReviews(true);
        try {
          const data = await reviewApi.getMentorReviews(mentorId, 10, 0);
          setReviews(data);
        } catch (err) {
          console.error('Failed to load reviews:', err);
        } finally {
          setLoadingReviews(false);
        }
      };
      loadReviews();
    }
  }, [mentorId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-purple"></div>
          <p className="mt-4 text-text-grey/70">Loading mentor profile...</p>
        </div>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p>{error || 'Mentor not found'}</p>
          <Button onClick={() => navigate('/mentors')} className="mt-4">
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        onClick={() => navigate('/mentors')}
        variant="outline"
        className="mb-6"
        aria-label="Back to mentor search"
      >
        ← Back to Search
      </Button>

      {/* Mentor Profile */}
      <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-shrink-0">
            {mentor.profile_image_url ? (
              <img
                src={mentor.profile_image_url}
                alt="Mentor profile"
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-purple to-primary-purple/70 flex items-center justify-center text-white text-4xl font-semibold">
                {mentor.id.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-text-grey mb-2">Mentor Profile</h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <span className="text-yellow-500 text-xl">★</span>
                    <span className="ml-1 text-lg font-semibold text-text-grey">
                      {mentor.average_rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-text-grey/60">•</span>
                  <span className="text-text-grey">
                    {mentor.total_reviews} review{mentor.total_reviews !== 1 ? 's' : ''}
                  </span>
                  <span className="text-text-grey/60">•</span>
                  <span className="text-text-grey">
                    {mentor.total_sessions_completed} sessions
                  </span>
                </div>
              </div>
              {mentor.is_available && (
                <span className="px-4 py-2 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                  Available
                </span>
              )}
            </div>

            <div className="text-2xl font-semibold text-primary-purple mb-4">
              ${mentor.hourly_rate?.toFixed(2)}/hr
            </div>

            {mentor.bio && (
              <p className="text-text-grey mb-4 leading-relaxed">{mentor.bio}</p>
            )}

            {/* Expertise Areas */}
            {mentor.expertise_areas.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-text-grey mb-2">Expertise Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {mentor.expertise_areas.map((ea) => (
                    <span
                      key={ea.expertise_id}
                      className="px-3 py-1 bg-purple-100 text-primary-purple rounded-full text-sm font-medium"
                    >
                      {ea.name} {ea.proficiency_level && `(${ea.proficiency_level})`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {mentor.languages.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-text-grey mb-2">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {mentor.languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-text-grey rounded-full text-sm"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Years of Experience */}
            {mentor.years_of_experience && (
              <div className="text-sm text-text-grey/70 mb-4">
                {mentor.years_of_experience} years of experience
              </div>
            )}

            <div className="flex gap-4 mt-6">
              {user && (user.role === 'mentee' || user.role === 'patient') && user.id !== mentor.id && (
                <>
                  <Button
                    onClick={async () => {
                      if (!user || !mentorId) return;
                      setCreatingSession(true);
                      try {
                        // Tạo session ngay lập tức, không cần chờ duyệt
                        const session = await sessionApi.createSession({
                          session_config: {
                            mentor_id: mentorId,
                            mentee_goal: 'Quick session booking',
                            mentee_questions: 'No specific questions',
                            scheduled_start_time: new Date().toISOString(),
                          },
                          recording_preferences: { recording_enabled: false },
                        });
                        // Redirect đến waiting room
                        navigate(`/sessions/${session.session_id}/waiting`);
                      } catch (err: any) {
                        console.error('Failed to create session:', err);
                        alert(err.response?.data?.error || err.message || 'Failed to create session');
                      } finally {
                        setCreatingSession(false);
                      }
                    }}
                    disabled={creatingSession}
                    className="flex-1"
                    aria-label="Book a session with this mentor"
                  >
                    {creatingSession ? 'Creating Session...' : 'Book a Session'}
                  </Button>
                  <Link to={`/profile/${mentor.id}/apply`}>
                    <Button variant="outline" className="flex-1" aria-label="Apply for a session with this mentor">
                      Apply for Session
                    </Button>
                  </Link>
                </>
              )}
              {(!user || (user.role !== 'mentee' && user.role !== 'patient') || user.id === mentor.id) && (
                <Link to={`/mentors/${mentor.id}/book`}>
                  <Button variant="primary" className="flex-1" aria-label="Book a session with this mentor">
                    Book a Session
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h2 className="text-2xl font-bold text-text-grey mb-6">Reviews</h2>
        {loadingReviews ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-purple"></div>
          </div>
        ) : reviews && reviews.reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </div>
                  <span className="text-sm text-text-grey/70">
                    {new Date(review.created_at || '').toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-text-grey">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-grey/70">No reviews yet.</p>
        )}
      </div>
    </div>
  );
};


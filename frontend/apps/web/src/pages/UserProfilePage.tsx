/**
 * User Profile Page - Professional Profile View
 * Brand colors (#A11692), Responsive, WCAG 2.1 AA compliant
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { userApi } from '../services/userApi';
import { mentorApi } from '../services/mentorApi';
import { Button } from '../components/ui/Button';
import type { User } from '../types/user';
import type { Mentor } from '../types/mentor';

export const UserProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(user);
  const [mentorProfile, setMentorProfile] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setError('User not found. Please login again.');
        setLoading(false);
        setHasLoaded(null);
        return;
      }

      // Prevent re-loading if we've already loaded for this user
      if (hasLoaded === user.id) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Load user profile
        try {
          const userData = await userApi.getCurrentUser();
          setProfile(userData);
        } catch (apiError: any) {
          // If API endpoint doesn't exist (404) or other errors, use authStore user
          if (apiError.response?.status === 404 || apiError.response?.status === 501) {
            console.log('User API endpoint not implemented, using authStore user');
            setProfile(user);
          } else {
            console.warn('Failed to load user from API, using authStore user:', apiError.message);
            setProfile(user); // Fallback to authStore user
          }
        }

        // Load mentor profile if user is a mentor
        if (user.role === 'mentor' || user.role === 'MENTOR') {
          try {
            const mentor = await mentorApi.getMentorById(user.id);
            setMentorProfile(mentor);
          } catch (mentorError: any) {
            // Mentor profile might not exist yet, that's okay - don't show error
            if (mentorError.response?.status !== 404) {
              console.warn('Mentor profile not found or error loading:', mentorError.message);
            }
            // Set to null so UI doesn't try to render mentor profile
            setMentorProfile(null);
          }
        }
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        // Only set error if it's a critical error, not just missing data
        if (err.response?.status !== 404) {
          setError(err.message || 'Failed to load profile');
        }
        setProfile(user); // Fallback to authStore user
      } finally {
        setLoading(false);
        setHasLoaded(user.id);
      }
    };
    
    loadProfile();
  }, [user?.id]); // Only depend on user.id, not the whole user object

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const isMentor = profile?.role === 'mentor' || profile?.role === 'MENTOR';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: '#A11692' + '30' }}></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#A11692] animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center">
          <p className="text-gray-600 mb-4">Profile not found</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#514B50' }}>
            My Profile
          </h1>
          <p className="text-gray-600">Manage your personal information and professional details</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-800" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 sticky top-6">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={`${profile.full_name}'s profile`}
                    className="w-32 h-32 rounded-full object-cover mb-4 border-4"
                    style={{ borderColor: '#A11692' }}
                  />
                ) : (
                  <div
                    className="w-32 h-32 rounded-full flex items-center justify-center text-white text-4xl font-semibold mb-4"
                    style={{ background: 'linear-gradient(90deg, #A11692 0%, #A31694 100%)' }}
                  >
                    {getInitials(profile.full_name)}
                  </div>
                )}
                <h2 className="text-2xl font-semibold mb-1" style={{ color: '#514B50' }}>
                  {profile.full_name}
                </h2>
                <p className="text-sm capitalize mb-4" style={{ color: '#514B50' }}>
                  {profile.role === 'mentor' || profile.role === 'MENTOR' ? 'Mentorship Provider' : 'Patient'}
                </p>
                
                {/* Edit Button */}
                <Button
                  onClick={() => navigate('/profile/edit')}
                  variant="primary"
                  className="w-full"
                  aria-label="Edit profile"
                >
                  Edit Profile
                </Button>
              </div>

              {/* Basic Info */}
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#514B50' }}>
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
                      <p className="text-sm" style={{ color: '#514B50' }}>{profile.email}</p>
                    </div>
                    {profile.phone && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Phone</p>
                        <p className="text-sm" style={{ color: '#514B50' }}>{profile.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {profile.created_at && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Member Since</p>
                    <p className="text-sm" style={{ color: '#514B50' }}>
                      {new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mentor Profile Details */}
            {isMentor && mentorProfile && (
              <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold" style={{ color: '#514B50' }}>
                    Professional Information
                  </h2>
                  {mentorProfile.is_available && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: '#28a745' + '20', color: '#28a745' }}
                    >
                      Available
                    </span>
                  )}
                </div>

                <div className="space-y-6">
                  {mentorProfile.bio && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2" style={{ color: '#514B50' }}>
                        About Me
                      </h3>
                      <p className="text-gray-600 leading-relaxed">{mentorProfile.bio}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {mentorProfile.hourly_rate !== undefined && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2" style={{ color: '#514B50' }}>
                          Hourly Rate
                        </h3>
                        <p className="text-gray-600">${mentorProfile.hourly_rate}/hour</p>
                      </div>
                    )}
                    {mentorProfile.years_of_experience !== undefined && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2" style={{ color: '#514B50' }}>
                          Experience
                        </h3>
                        <p className="text-gray-600">
                          {mentorProfile.years_of_experience} {mentorProfile.years_of_experience === 1 ? 'year' : 'years'}
                        </p>
                      </div>
                    )}
                    {(mentorProfile.average_rating ?? 0) > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2" style={{ color: '#514B50' }}>
                          Rating
                        </h3>
                        <p className="text-gray-600">
                          {mentorProfile.average_rating.toFixed(1)} ⭐ ({mentorProfile.total_reviews || 0} reviews)
                        </p>
                      </div>
                    )}
                    {(mentorProfile.total_sessions_completed ?? 0) > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2" style={{ color: '#514B50' }}>
                          Sessions Completed
                        </h3>
                        <p className="text-gray-600">{mentorProfile.total_sessions_completed}</p>
                      </div>
                    )}
                  </div>

                  {mentorProfile.languages && mentorProfile.languages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2" style={{ color: '#514B50' }}>
                        Languages
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {mentorProfile.languages.map((lang, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full text-sm"
                            style={{ backgroundColor: '#A11692' + '15', color: '#A11692' }}
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {mentorProfile.expertise_areas && mentorProfile.expertise_areas.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2" style={{ color: '#514B50' }}>
                        Expertise Areas
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {mentorProfile.expertise_areas.map((expertise, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full text-sm"
                            style={{ backgroundColor: '#A11692' + '15', color: '#A11692' }}
                          >
                            {expertise.name || expertise.expertise_id}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#514B50' }}>
                Quick Actions
              </h2>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => navigate('/settings')}
                  variant="outline"
                  aria-label="Go to settings"
                >
                  Settings
                </Button>
                {isMentor && (
                  <Button
                    onClick={() => navigate(`/mentors/${profile.id}`)}
                    variant="outline"
                    aria-label="View public mentor profile"
                  >
                    View Public Profile
                  </Button>
                )}
                <Button
                  onClick={() => navigate('/sessions')}
                  variant="outline"
                  aria-label="View sessions"
                >
                  My Sessions
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

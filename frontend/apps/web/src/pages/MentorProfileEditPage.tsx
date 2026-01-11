/**
 * Mentor Profile Edit Page - Complete Profile Management
 * Brand colors (#A11692), Responsive, WCAG 2.1 AA compliant
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { mentorApi } from '../services/mentorApi';
import { userApi } from '../services/userApi';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { AvatarUpload } from '../components/features/profile/AvatarUpload';
import { SkillsSelector } from '../components/features/profile/SkillsSelector';
import type { MentorUpdateRequest } from '../types/mentor';
import type { UserUpdateRequest } from '../types/user';

export const MentorProfileEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // User basic info
  const [userFormData, setUserFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || '',
  });

  // Mentor professional info
  const [formData, setFormData] = useState({
    bio: '',
    title: '',
    experience: '',
    achievements: '',
    hourly_rate: 0,
    years_of_experience: 0,
    languages: [] as string[],
    skills: [] as string[],
    is_available: true,
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Load user profile
        try {
          const userData = await userApi.getCurrentUser();
          setUserFormData({
            full_name: userData.full_name,
            phone: userData.phone || '',
            avatar_url: userData.avatar_url || '',
          });
          setUser(userData);
        } catch (apiError: any) {
          if (apiError.response?.status !== 404) {
            throw apiError;
          }
        }

        // Load mentor profile
        try {
          const mentor = await mentorApi.getMentorById(user.id);
          setFormData({
            bio: mentor.bio || '',
            title: '', // Not in current Mentor type, but needed per TDD
            experience: '', // Not in current Mentor type, but needed per TDD
            achievements: '', // Not in current Mentor type, but needed per TDD
            hourly_rate: mentor.hourly_rate || 0,
            years_of_experience: mentor.years_of_experience || 0,
            languages: mentor.languages || [],
            skills: mentor.expertise_areas?.map(e => e.expertise_id) || [],
            is_available: mentor.is_available ?? true,
          });
        } catch (mentorError: any) {
          // Mentor profile might not exist yet, that's okay
          console.log('Mentor profile not found, using defaults');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [user, setUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Update user profile
      await userApi.updateCurrentUser(userFormData as UserUpdateRequest);

      // Update mentor profile
      const mentorUpdate: MentorUpdateRequest = {
        bio: formData.bio || undefined,
        hourly_rate: formData.hourly_rate || undefined,
        years_of_experience: formData.years_of_experience || undefined,
        languages: formData.languages.length > 0 ? formData.languages : undefined,
        profile_image_url: userFormData.avatar_url || undefined,
        is_available: formData.is_available,
      };
      await mentorApi.updateMentor(user.id, mentorUpdate);

      // TODO: Update skills via POST/DELETE /profiles/mentor/skills API when available
      // For now, skills are stored in formData but not sent to backend

      setSuccess(true);
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#514B50' }}>
            Edit Mentor Profile
          </h1>
          <p className="text-gray-600">Update your professional information and expertise</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-800" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 text-green-800" role="alert">
            Profile updated successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 space-y-8">
          {/* Basic Information Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#514B50' }}>
              Basic Information
            </h2>
            
            <div className="space-y-6">
              {/* Avatar Upload */}
              <AvatarUpload
                currentAvatarUrl={userFormData.avatar_url}
                onAvatarChange={(url) => setUserFormData({ ...userFormData, avatar_url: url })}
                initials={getInitials(userFormData.full_name)}
              />

              {/* Full Name */}
              <div>
                <Input
                  id="full_name"
                  label="Full Name"
                  value={userFormData.full_name}
                  onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                  required
                  aria-required="true"
                />
              </div>

              {/* Phone */}
              <div>
                <Input
                  id="phone"
                  label="Phone Number"
                  type="tel"
                  value={userFormData.phone}
                  onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                  aria-label="Phone number"
                />
              </div>
            </div>
          </section>

          {/* Professional Information Section */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#514B50' }}>
              Professional Information
            </h2>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <Input
                  id="title"
                  label="Professional Title"
                  placeholder="e.g., Senior Software Engineer, Life Coach"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  aria-label="Professional title"
                />
              </div>

              {/* Bio */}
              <div>
                <Textarea
                  id="bio"
                  label="Bio / About Me"
                  placeholder="Tell us about yourself, your background, and what makes you a great mentor..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  aria-label="Bio"
                />
              </div>

              {/* Experience */}
              <div>
                <Textarea
                  id="experience"
                  label="Experience"
                  placeholder="Describe your professional experience, career journey, and key milestones..."
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  rows={5}
                  aria-label="Professional experience"
                />
              </div>

              {/* Achievements */}
              <div>
                <Textarea
                  id="achievements"
                  label="Achievements"
                  placeholder="List your notable achievements, certifications, awards, or recognitions..."
                  value={formData.achievements}
                  onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                  rows={4}
                  aria-label="Achievements"
                />
              </div>

              {/* Skills Selector */}
              <SkillsSelector
                selectedSkills={formData.skills}
                onSkillsChange={(skills) => setFormData({ ...formData, skills })}
              />

              {/* Hourly Rate & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Input
                    id="hourly_rate"
                    label="Hourly Rate ($)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                    aria-label="Hourly rate in dollars"
                  />
                </div>
                <div>
                  <Input
                    id="years_of_experience"
                    label="Years of Experience"
                    type="number"
                    min="0"
                    value={formData.years_of_experience}
                    onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })}
                    aria-label="Years of experience"
                  />
                </div>
              </div>

              {/* Languages (comma-separated for now) */}
              <div>
                <Input
                  id="languages"
                  label="Languages (comma-separated)"
                  placeholder="e.g., English, Vietnamese, Spanish"
                  value={formData.languages.join(', ')}
                  onChange={(e) => {
                    const langs = e.target.value.split(',').map(l => l.trim()).filter(l => l);
                    setFormData({ ...formData, languages: langs });
                  }}
                  aria-label="Languages spoken"
                />
              </div>

              {/* Availability Toggle */}
              <div className="flex items-center gap-3">
                <input
                  id="is_available"
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 focus:ring-2"
                  style={{ '--tw-ring-color': '#A11692' } as React.CSSProperties}
                  aria-label="Available for sessions"
                />
                <label htmlFor="is_available" className="text-sm font-medium" style={{ color: '#514B50' }}>
                  Available for new sessions
                </label>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <Button
              type="submit"
              disabled={saving}
              variant="primary"
              className="flex-1"
              aria-label="Save profile changes"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/profile')}
              className="flex-1"
              aria-label="Cancel editing"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

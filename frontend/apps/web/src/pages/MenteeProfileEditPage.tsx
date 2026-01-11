/**
 * Mentee Profile Edit Page - Basic Profile Management
 * Brand colors (#A11692), Responsive, WCAG 2.1 AA compliant
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { userApi } from '../services/userApi';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AvatarUpload } from '../components/features/profile/AvatarUpload';
import { ChangePassword } from '../components/features/profile/ChangePassword';
import type { UserUpdateRequest } from '../types/user';

export const MenteeProfileEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const userData = await userApi.getCurrentUser();
        setFormData({
          full_name: userData.full_name,
          phone: userData.phone || '',
          avatar_url: userData.avatar_url || '',
        });
        setUser(userData);
      } catch (apiError: any) {
        if (apiError.response?.status === 404) {
          console.log('User API endpoint not implemented, using authStore user');
          setFormData({
            full_name: user.full_name,
            phone: user.phone || '',
            avatar_url: user.avatar_url || '',
          });
        } else {
          setError(apiError.message || 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [user, setUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await userApi.updateCurrentUser(formData as UserUpdateRequest);
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
            Edit Profile
          </h1>
          <p className="text-gray-600">Update your personal information</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
              {/* Avatar Upload */}
              <AvatarUpload
                currentAvatarUrl={formData.avatar_url}
                onAvatarChange={(url) => setFormData({ ...formData, avatar_url: url })}
                initials={getInitials(formData.full_name)}
              />

              {/* Full Name */}
              <div>
                <Input
                  id="full_name"
                  label="Full Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  aria-label="Phone number"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#514B50' }}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 min-h-[44px] cursor-not-allowed"
                  aria-label="Email address (cannot be changed)"
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>

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

          {/* Sidebar - Password Change */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              {!showPasswordForm ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#514B50' }}>
                    Security
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordForm(true)}
                    className="w-full"
                    aria-label="Change password"
                  >
                    Change Password
                  </Button>
                </div>
              ) : (
                <ChangePassword
                  onSuccess={() => {
                    setShowPasswordForm(false);
                  }}
                  onCancel={() => setShowPasswordForm(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

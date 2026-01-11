/**
 * Settings Page
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../services/userApi';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { PasswordUpdateRequest } from '../types/user';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const request: PasswordUpdateRequest = {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      };
      await userApi.updatePassword(request);
      setSuccess(true);
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text-grey mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Password Change */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-semibold text-text-grey mb-6">Change Password</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 mb-4">
              Password updated successfully
            </div>
          )}

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label htmlFor="old_password" className="block text-sm font-semibold text-text-grey mb-2">
                Current Password
              </label>
              <Input
                id="old_password"
                type="password"
                value={passwordData.old_password}
                onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="new_password" className="block text-sm font-semibold text-text-grey mb-2">
                New Password
              </label>
              <Input
                id="new_password"
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                required
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-semibold text-text-grey mb-2">
                Confirm New Password
              </label>
              <Input
                id="confirm_password"
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                required
                minLength={8}
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </div>

        {/* Logout */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-semibold text-text-grey mb-4">Account</h2>
          <Button onClick={handleLogout} variant="danger" aria-label="Logout">
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};


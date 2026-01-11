/**
 * Change Password Component
 * WCAG 2.1 AA compliant
 */
import React, { useState } from 'react';
import { userApi } from '../../../services/userApi';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

interface ChangePasswordProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const validateForm = (): boolean => {
    if (!formData.old_password) {
      setError('Current password is required');
      return false;
    }
    if (!formData.new_password) {
      setError('New password is required');
      return false;
    }
    if (formData.new_password.length < 8) {
      setError('New password must be at least 8 characters');
      return false;
    }
    if (formData.new_password !== formData.confirm_password) {
      setError('New passwords do not match');
      return false;
    }
    if (formData.old_password === formData.new_password) {
      setError('New password must be different from current password');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setSaving(true);
    try {
      await userApi.updatePassword({
        old_password: formData.old_password,
        new_password: formData.new_password,
      });
      
      // Reset form
      setFormData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#514B50' }}>
        Change Password
      </h3>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Current Password */}
      <div>
        <label htmlFor="old_password" className="block text-sm font-medium mb-2" style={{ color: '#514B50' }}>
          Current Password
        </label>
        <div className="relative">
          <Input
            id="old_password"
            type={showPassword.old ? 'text' : 'password'}
            value={formData.old_password}
            onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
            required
            className="pr-10"
            aria-label="Current password"
          />
          <button
            type="button"
            onClick={() => setShowPassword({ ...showPassword, old: !showPassword.old })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 rounded"
            aria-label={showPassword.old ? 'Hide password' : 'Show password'}
          >
            {showPassword.old ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div>
        <label htmlFor="new_password" className="block text-sm font-medium mb-2" style={{ color: '#514B50' }}>
          New Password
        </label>
        <div className="relative">
          <Input
            id="new_password"
            type={showPassword.new ? 'text' : 'password'}
            value={formData.new_password}
            onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
            required
            minLength={8}
            className="pr-10"
            aria-label="New password"
          />
          <button
            type="button"
            onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 rounded"
            aria-label={showPassword.new ? 'Hide password' : 'Show password'}
          >
            {showPassword.new ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirm_password" className="block text-sm font-medium mb-2" style={{ color: '#514B50' }}>
          Confirm New Password
        </label>
        <div className="relative">
          <Input
            id="confirm_password"
            type={showPassword.confirm ? 'text' : 'password'}
            value={formData.confirm_password}
            onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
            required
            className="pr-10"
            aria-label="Confirm new password"
          />
          <button
            type="button"
            onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 rounded"
            aria-label={showPassword.confirm ? 'Hide password' : 'Show password'}
          >
            {showPassword.confirm ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={saving}
          variant="primary"
          className="flex-1"
          aria-label="Update password"
        >
          {saving ? 'Updating...' : 'Update Password'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            aria-label="Cancel password change"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

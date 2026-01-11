import React, { useState, useEffect } from 'react';
import { notificationApi } from '../../../services/notificationApi';
import type { NotificationPreferences } from '../../../types/calendar';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

export const NotificationPreferencesComponent: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email_enabled: true,
    in_app_enabled: true,
    push_enabled: false,
    notify_24h_before: true,
    notify_1h_before: true,
    notify_15min_before: false,
    notify_5min_before: false,
    quiet_hours_start: '',
    quiet_hours_end: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const prefs = await notificationApi.getPreferences();
      setPreferences(prefs);
      setFormData({
        email_enabled: prefs.email_enabled,
        in_app_enabled: prefs.in_app_enabled,
        push_enabled: prefs.push_enabled,
        notify_24h_before: prefs.notify_24h_before,
        notify_1h_before: prefs.notify_1h_before,
        notify_15min_before: prefs.notify_15min_before,
        notify_5min_before: prefs.notify_5min_before,
        quiet_hours_start: prefs.quiet_hours_start || '',
        quiet_hours_end: prefs.quiet_hours_end || '',
        timezone: prefs.timezone,
      });
    } catch (err) {
      console.error('Error loading notification preferences:', err);
      setError('Không thể tải cài đặt thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await notificationApi.updatePreferences(formData);
      await loadPreferences();
      alert('Đã cập nhật cài đặt thông báo thành công');
    } catch (err: any) {
      console.error('Error saving notification preferences:', err);
      setError(err.response?.data?.error || 'Không thể lưu cài đặt thông báo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-text-grey text-sm">Đang tải...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-text-grey mb-3">Kênh Thông Báo</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-text-grey">
              <input
                type="checkbox"
                checked={formData.email_enabled}
                onChange={(e) => setFormData({ ...formData, email_enabled: e.target.checked })}
                className="rounded"
              />
              Email
            </label>
            <label className="flex items-center gap-2 text-sm text-text-grey">
              <input
                type="checkbox"
                checked={formData.in_app_enabled}
                onChange={(e) => setFormData({ ...formData, in_app_enabled: e.target.checked })}
                className="rounded"
              />
              Thông báo trong ứng dụng
            </label>
            <label className="flex items-center gap-2 text-sm text-text-grey">
              <input
                type="checkbox"
                checked={formData.push_enabled}
                onChange={(e) => setFormData({ ...formData, push_enabled: e.target.checked })}
                className="rounded"
              />
              Push Notification (sắp có)
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-text-grey mb-3">Thời Điểm Nhắc Nhở</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-text-grey">
              <input
                type="checkbox"
                checked={formData.notify_24h_before}
                onChange={(e) => setFormData({ ...formData, notify_24h_before: e.target.checked })}
                className="rounded"
              />
              24 giờ trước
            </label>
            <label className="flex items-center gap-2 text-sm text-text-grey">
              <input
                type="checkbox"
                checked={formData.notify_1h_before}
                onChange={(e) => setFormData({ ...formData, notify_1h_before: e.target.checked })}
                className="rounded"
              />
              1 giờ trước
            </label>
            <label className="flex items-center gap-2 text-sm text-text-grey">
              <input
                type="checkbox"
                checked={formData.notify_15min_before}
                onChange={(e) => setFormData({ ...formData, notify_15min_before: e.target.checked })}
                className="rounded"
              />
              15 phút trước
            </label>
            <label className="flex items-center gap-2 text-sm text-text-grey">
              <input
                type="checkbox"
                checked={formData.notify_5min_before}
                onChange={(e) => setFormData({ ...formData, notify_5min_before: e.target.checked })}
                className="rounded"
              />
              5 phút trước
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-text-grey mb-3">Giờ Yên Tĩnh</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                type="time"
                label="Bắt đầu"
                value={formData.quiet_hours_start}
                onChange={(e) => setFormData({ ...formData, quiet_hours_start: e.target.value })}
              />
            </div>
            <div>
              <Input
                type="time"
                label="Kết thúc"
                value={formData.quiet_hours_end}
                onChange={(e) => setFormData({ ...formData, quiet_hours_end: e.target.value })}
              />
            </div>
          </div>
          <p className="text-xs text-text-grey/70 mt-1">
            Không nhận thông báo trong khoảng thời gian này
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-grey mb-1">
            Múi giờ
          </label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
            <option value="UTC">UTC (GMT+0)</option>
            <option value="America/New_York">America/New_York (GMT-5)</option>
            <option value="Europe/London">Europe/London (GMT+0)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
          </select>
        </div>

        <Button type="submit" variant="primary" size="sm" disabled={saving} className="w-full">
          {saving ? 'Đang lưu...' : 'Lưu Cài Đặt'}
        </Button>
      </form>
    </div>
  );
};

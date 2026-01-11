import React, { useState, useEffect } from 'react';
import { calendarApi } from '../../../services/calendarApi';
import type { AvailabilitySlot } from '../../../types/calendar';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const dayNamesShort = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

interface AvailabilityFormData {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
}

export const AvailabilityManager: React.FC = () => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [formData, setFormData] = useState<AvailabilityFormData>({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    is_recurring: true,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await calendarApi.getAvailabilitySlots();
      setSlots(response.slots);
    } catch (err) {
      console.error('Error loading availability slots:', err);
      setError('Không thể tải lịch trống');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.start_time >= formData.end_time) {
      errors.end_time = 'Thời gian kết thúc phải sau thời gian bắt đầu';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Format time to HH:mm:ss
      const submitData = {
        ...formData,
        start_time: `${formData.start_time}:00`,
        end_time: `${formData.end_time}:00`,
      };
      
      if (editingSlot) {
        await calendarApi.updateAvailabilitySlot(editingSlot.id, submitData);
      } else {
        await calendarApi.createAvailabilitySlot(submitData);
      }
      await loadSlots();
      resetForm();
    } catch (err: any) {
      console.error('Error saving availability slot:', err);
      setError(err.response?.data?.error || 'Không thể lưu lịch trống');
    }
  };

  const resetForm = () => {
    setFormData({
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      is_recurring: true,
      is_active: true,
    });
    setFormErrors({});
    setShowForm(false);
    setEditingSlot(null);
  };

  const handleEdit = (slot: AvailabilitySlot) => {
    setEditingSlot(slot);
    setFormData({
      day_of_week: slot.day_of_week,
      start_time: slot.start_time.slice(0, 5),
      end_time: slot.end_time.slice(0, 5),
      is_recurring: slot.is_recurring,
      valid_from: slot.valid_from || undefined,
      valid_until: slot.valid_until || undefined,
      is_active: slot.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lịch trống này?')) {
      return;
    }
    try {
      await calendarApi.deleteAvailabilitySlot(slotId);
      await loadSlots();
    } catch (err) {
      console.error('Error deleting availability slot:', err);
      alert('Không thể xóa lịch trống');
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

      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-text-grey">
            {editingSlot ? 'Chỉnh sửa' : 'Thêm'} Lịch Trống
          </h3>

          <div>
            <label className="block text-sm font-medium text-text-grey mb-1">
              Ngày trong tuần
            </label>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {dayNames.map((day, index) => (
                <option key={index} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-grey mb-1">
                Giờ bắt đầu
              </label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                error={formErrors.start_time}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-grey mb-1">
                Giờ kết thúc
              </label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                error={formErrors.end_time}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-text-grey">
              <input
                type="checkbox"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                className="rounded"
              />
              Lặp lại hàng tuần
            </label>
            <label className="flex items-center gap-2 text-sm text-text-grey">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              Đang hoạt động
            </label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" className="flex-1">
              {editingSlot ? 'Cập nhật' : 'Thêm'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={resetForm} className="flex-1">
              Hủy
            </Button>
          </div>
        </form>
      ) : (
        <>
          {slots.length === 0 ? (
            <div className="text-text-grey/70 text-sm text-center py-4">
              Chưa có lịch trống nào được cấu hình
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    slot.is_active
                      ? 'bg-white border-gray-200'
                      : 'bg-gray-100 border-gray-300 opacity-60'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-grey">
                        {dayNames[slot.day_of_week]}
                      </span>
                      {!slot.is_active && (
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                          Tạm tắt
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-text-grey/70 mt-1">
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </div>
                    {slot.is_recurring && (
                      <div className="text-xs text-text-grey/50 mt-1">Lặp lại hàng tuần</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(slot)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(slot.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowForm(true)}
            className="w-full"
          >
            + Thêm Lịch Trống
          </Button>
        </>
      )}
    </div>
  );
};

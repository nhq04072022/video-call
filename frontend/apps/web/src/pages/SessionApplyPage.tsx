/**
 * Session Application Form (S-05)
 * Form for mentee to apply for a session with a mentor
 */
import React, { useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Input } from '../components/ui/Input';
import { sessionApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';

export const SessionApplyPage: React.FC = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setCurrentSessionId = useSessionStore((state) => state.setCurrentSessionId);

  const [formData, setFormData] = useState({
    mentee_goal: '',
    mentee_questions: '',
    scheduled_time: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not logged in or not a mentee
  React.useEffect(() => {
    if (!user) {
      navigate('/login?redirectTo=' + encodeURIComponent(`/profile/${mentorId}/apply`));
      return;
    }
    if (user.role !== 'mentee' && user.role !== 'patient') {
      navigate('/sessions');
      return;
    }
  }, [user, mentorId, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.mentee_goal.trim()) {
      newErrors.mentee_goal = 'Mục tiêu phiên là bắt buộc';
    } else if (formData.mentee_goal.length > 500) {
      newErrors.mentee_goal = 'Mục tiêu phiên không được vượt quá 500 ký tự';
    }

    if (!formData.mentee_questions.trim()) {
      newErrors.mentee_questions = 'Câu hỏi cụ thể là bắt buộc';
    } else if (formData.mentee_questions.length > 1000) {
      newErrors.mentee_questions = 'Câu hỏi cụ thể không được vượt quá 1000 ký tự';
    }

    if (!formData.scheduled_time) {
      newErrors.scheduled_time = 'Thời gian đề xuất là bắt buộc';
    } else {
      const scheduledDate = new Date(formData.scheduled_time);
      const now = new Date();
      if (scheduledDate <= now) {
        newErrors.scheduled_time = 'Thời gian đề xuất phải trong tương lai';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!mentorId || !user) {
      setError('Missing mentor ID or user information');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
      // datetime-local input provides date/time in user's local timezone without timezone info
      // We need to treat it as local time and convert to UTC for backend
      let scheduledTimeISO: string;
      if (formData.scheduled_time) {
        // datetime-local format: "2024-01-15T10:30" (no timezone, treated as local time)
        // Create Date object - JavaScript will interpret this as local time
        const localDate = new Date(formData.scheduled_time);
        
        // Validate the date
        if (isNaN(localDate.getTime())) {
          throw new Error('Invalid scheduled time format');
        }
        
        // Convert to ISO string (UTC) - this preserves the actual moment in time
        scheduledTimeISO = localDate.toISOString();
        
        console.log(`[SessionApply] Local input: ${formData.scheduled_time}, UTC ISO: ${scheduledTimeISO}`);
      } else {
        // Fallback to current time + 1 hour if not provided
        const defaultTime = new Date();
        defaultTime.setHours(defaultTime.getHours() + 1);
        scheduledTimeISO = defaultTime.toISOString();
      }

      // Create session request
      const response = await sessionApi.createSession({
        booking_id: '', // Not needed for direct session creation
        session_config: {
          mentor_id: mentorId,
          mentee_goal: formData.mentee_goal,
          mentee_questions: formData.mentee_questions,
          scheduled_start_time: scheduledTimeISO,
        },
        recording_preferences: {},
      });

      // Store session ID
      setCurrentSessionId(response.session_id);

      // Redirect to session detail or dashboard
      navigate(`/sessions/${response.session_id}`, { replace: true });
    } catch (err: any) {
      console.error('Failed to create session:', err);
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        'Không thể tạo phiên. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!user || (user.role !== 'mentee' && user.role !== 'patient')) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="wave-background min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-card-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-heading text-text-grey mb-2">
              Đăng Ký Phiên Tư Vấn
            </h1>
            <p className="text-gray-600">
              Điền thông tin bên dưới để gửi yêu cầu phiên tư vấn với mentor
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Mục tiêu Phiên */}
            <div>
              <Textarea
                label="Mục tiêu Phiên *"
                value={formData.mentee_goal}
                onChange={(e) => handleChange('mentee_goal', e.target.value)}
                placeholder="Mô tả mục tiêu bạn muốn đạt được trong phiên này (tối đa 500 ký tự)"
                required
                maxLength={500}
                rows={4}
                aria-required="true"
                aria-invalid={errors.mentee_goal ? 'true' : 'false'}
                aria-describedby={errors.mentee_goal ? 'goal-error' : undefined}
                disabled={isLoading}
                error={errors.mentee_goal}
              />
              <div className="mt-1 text-sm text-gray-500 text-right">
                {formData.mentee_goal.length}/500
              </div>
            </div>

            {/* Câu hỏi Cụ thể */}
            <div>
              <Textarea
                label="Câu hỏi Cụ thể *"
                value={formData.mentee_questions}
                onChange={(e) => handleChange('mentee_questions', e.target.value)}
                placeholder="Đặt câu hỏi cụ thể bạn muốn mentor giải đáp (tối đa 1000 ký tự)"
                required
                maxLength={1000}
                rows={5}
                aria-required="true"
                aria-invalid={errors.mentee_questions ? 'true' : 'false'}
                aria-describedby={errors.mentee_questions ? 'questions-error' : undefined}
                disabled={isLoading}
                error={errors.mentee_questions}
              />
              <div className="mt-1 text-sm text-gray-500 text-right">
                {formData.mentee_questions.length}/1000
              </div>
            </div>

            {/* Thời gian Đề xuất */}
            <div>
              <Input
                type="datetime-local"
                label="Thời gian Đề xuất *"
                value={formData.scheduled_time}
                onChange={(e) => handleChange('scheduled_time', e.target.value)}
                required
                aria-required="true"
                aria-invalid={errors.scheduled_time ? 'true' : 'false'}
                aria-describedby={errors.scheduled_time ? 'time-error' : undefined}
                disabled={isLoading}
                error={errors.scheduled_time}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isLoading}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="flex-1"
                aria-label={isLoading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu'}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Đang gửi...
                  </span>
                ) : (
                  'Gửi Yêu Cầu'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};



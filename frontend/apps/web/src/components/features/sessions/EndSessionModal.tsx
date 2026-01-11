/**
 * End Session Validation Modal Component
 */
import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { Button } from '../../ui/Button';

interface EndSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (endReason: string, notes?: string) => Promise<void>;
  sessionId?: string;
}

const END_REASONS = [
  { value: 'normal_completion', label: 'Normal Completion' },
  { value: 'participant_left', label: 'Participant Left Early' },
  { value: 'technical_issue', label: 'Technical Issue' },
  { value: 'scheduling_conflict', label: 'Scheduling Conflict' },
  { value: 'other', label: 'Other' },
] as const;

export const EndSessionModal: React.FC<EndSessionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sessionId,
}) => {
  const [endReason, setEndReason] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLSelectElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleTab);
    document.addEventListener('keydown', handleEscape);

    // Focus first element
    setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isSubmitting, onClose]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setEndReason('');
      setNotes('');
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!endReason) {
      newErrors.endReason = 'Please select an end reason';
    }
    
    if (notes.length > 500) {
      newErrors.notes = 'Notes must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onConfirm(endReason, notes || undefined);
      onClose();
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to end session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-session-title"
      aria-describedby="end-session-description"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-card-lg shadow-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="end-session-title"
          className="text-2xl font-bold text-text-grey mb-2"
        >
          End Session
        </h2>
        <p
          id="end-session-description"
          className="text-sm text-gray-600 mb-6"
        >
          Please provide a reason for ending this session. This information will be recorded.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Error message */}
          {submitError && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-4 bg-red-50 border border-red-200 rounded-card"
            >
              <p className="text-sm font-medium text-red-800">{submitError}</p>
            </div>
          )}

          {/* End Reason Dropdown */}
          <div>
            <label
              htmlFor="end-reason-select"
              className="block text-sm font-medium text-text-grey mb-2"
            >
              End Reason <span className="text-red-500" aria-label="required">*</span>
            </label>
            <select
              ref={firstFocusableRef}
              id="end-reason-select"
              value={endReason}
              onChange={(e) => {
                setEndReason(e.target.value);
                setErrors((prev) => ({ ...prev, endReason: '' }));
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent ${
                errors.endReason ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-required="true"
              aria-invalid={errors.endReason ? 'true' : 'false'}
              aria-describedby={errors.endReason ? 'end-reason-error' : undefined}
              disabled={isSubmitting}
            >
              <option value="">Select a reason</option>
              {END_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
            {errors.endReason && (
              <p
                id="end-reason-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {errors.endReason}
              </p>
            )}
          </div>

          {/* Notes Textarea */}
          <div>
            <label
              htmlFor="end-session-notes"
              className="block text-sm font-medium text-text-grey mb-2"
            >
              Additional Notes (Optional)
            </label>
            <textarea
              id="end-session-notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setErrors((prev) => ({ ...prev, notes: '' }));
              }}
              rows={4}
              maxLength={500}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent ${
                errors.notes ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={errors.notes ? 'true' : 'false'}
              aria-describedby={errors.notes ? 'notes-error' : 'notes-description'}
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.notes && (
                <p
                  id="notes-error"
                  className="text-sm text-red-600"
                  role="alert"
                >
                  {errors.notes}
                </p>
              )}
              <p
                id="notes-description"
                className={`text-xs ml-auto ${
                  notes.length > 450 ? 'text-orange-600' : 'text-gray-500'
                }`}
              >
                {notes.length}/500 characters
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 min-h-[44px]"
            >
              Cancel
            </Button>
            <button
              ref={lastFocusableRef}
              type="submit"
              disabled={isSubmitting || !endReason}
              className="flex-1 rounded-button bg-gradient-primary text-white font-semibold py-3 px-6 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isSubmitting ? (
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
                  Ending...
                </span>
              ) : (
                'End Session'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


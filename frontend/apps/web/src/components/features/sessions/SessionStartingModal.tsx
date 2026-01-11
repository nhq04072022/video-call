import React, { useEffect, useState, useRef } from 'react';
import { useFocusTrap } from './AccessibilityHelpers';

interface ProgressStep {
  id: string;
  label: string;
  status: 'completed' | 'in-progress' | 'pending';
}

interface SessionStartingModalProps {
  onComplete?: () => void;
  onClose?: () => void;
}

export const SessionStartingModal: React.FC<SessionStartingModalProps> = ({ onComplete, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(true); // Focus trap for accessibility
  const [steps, setSteps] = useState<ProgressStep[]>([
    { id: 'validate', label: 'Validating participants', status: 'completed' },
    { id: 'recording', label: 'Initializing secure recording...', status: 'completed' },
    { id: 'ai', label: 'Activating AI insights engine...', status: 'in-progress' },
    { id: 'video', label: 'Establishing secure video connection...', status: 'pending' },
  ]);

  const [progress, setProgress] = useState(50);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (onComplete) {
            setTimeout(onComplete, 500);
          }
          return 100;
        }
        return prev + 8;
      });
    }, 600);

    // Simulate step progression
    const stepInterval = setInterval(() => {
      setSteps((prevSteps) => {
        const currentIndex = prevSteps.findIndex(s => s.status === 'in-progress');
        if (currentIndex >= 0 && currentIndex < prevSteps.length - 1) {
          const newSteps = [...prevSteps];
          newSteps[currentIndex].status = 'completed';
          newSteps[currentIndex + 1].status = 'in-progress';
          return newSteps;
        }
        return prevSteps;
      });
    }, 1800);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [onComplete]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="starting-session-title"
      aria-describedby="starting-session-description"
    >
      <div 
        ref={modalRef as React.RefObject<HTMLDivElement>}
        className="bg-white w-full max-w-md mx-4 shadow-2xl p-10 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:ring-offset-2"
        style={{ 
          borderRadius: '24px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
        }}
        tabIndex={-1}
      >
        {/* Progress Spinner */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#E0BBE4"
                strokeWidth="8"
              />
              {/* Progress circle - vibrant purple */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#9E2B9D"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className="transition-all duration-500 ease-out"
                style={{ stroke: '#9E2B9D' }}
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 id="starting-session-title" className="text-2xl font-bold text-gray-900 text-center mb-8 tracking-tight">
          Starting Session...
        </h2>
        <p id="starting-session-description" className="sr-only">
          Initializing session components. Please wait while we validate participants, initialize recording, activate AI insights, and establish video connection.
        </p>

        {/* Steps List */}
        <div className="space-y-5">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
                {step.status === 'completed' && (
                  <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {step.status === 'in-progress' && (
                  <div className="relative w-7 h-7">
                    <svg className="w-7 h-7 transform -rotate-90" viewBox="0 0 28 28">
                      <circle
                        cx="14"
                        cy="14"
                        r="12"
                        fill="none"
                        stroke="#9E2B9D"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 12}`}
                        strokeDashoffset={`${2 * Math.PI * 12 * 0.7}`}
                        className="animate-spin"
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                    </svg>
                  </div>
                )}
                {step.status === 'pending' && (
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {/* Label */}
              <span 
                className={`text-base ${
                  step.status === 'pending' 
                    ? 'text-gray-600' 
                    : step.status === 'in-progress'
                    ? 'text-gray-900 font-semibold'
                    : 'text-gray-900'
                }`}
                aria-live={step.status === 'in-progress' ? 'polite' : 'off'}
                aria-label={step.status === 'completed' ? `${step.label} completed` : step.status === 'in-progress' ? `${step.label} in progress` : `${step.label} pending`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


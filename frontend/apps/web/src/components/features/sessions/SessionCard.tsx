import React from 'react';
import { Button } from '../../ui/Button';

interface SessionCardProps {
  sessionId: string;
  status: string;
  mentorId?: string;
  patientId?: string;
  plannedDuration?: number;
  onViewDetails?: () => void;
  onJoin?: () => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  sessionId,
  status,
  mentorId,
  patientId,
  plannedDuration,
  onViewDetails,
  onJoin,
  onStart,
  onEnd,
}) => {
  const statusColors = {
    created: 'bg-blue-100 text-blue-800',
    started: 'bg-green-100 text-green-800',
    ended: 'bg-gray-100 text-gray-800',
    terminated: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white rounded-card-lg shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-200 animate-fade-in hover:scale-[1.02]">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-heading text-text-grey mb-1">Session {sessionId.slice(0, 8)}...</h3>
          <p className="text-sm text-gray-600">
            {mentorId && `Mentor: ${mentorId.slice(0, 8)}...`}
            {patientId && ` | Patient: ${patientId.slice(0, 8)}...`}
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-button text-xs font-semibold ${
          statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
        }`}>
          {status.toUpperCase()}
        </span>
      </div>

      {plannedDuration && (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Duration: {plannedDuration} minutes</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {onViewDetails && (
          <Button variant="secondary" size="sm" onClick={onViewDetails}>
            View Details
          </Button>
        )}
        {status === 'created' && onStart && (
          <Button variant="primary" size="sm" onClick={onStart}>
            Start Session
          </Button>
        )}
        {status === 'started' && onEnd && (
          <Button variant="danger" size="sm" onClick={onEnd}>
            End Session
          </Button>
        )}
      </div>
    </div>
  );
};






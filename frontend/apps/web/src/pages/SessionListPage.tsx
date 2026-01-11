import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { SessionCard } from '../components/features/sessions/SessionCard';

// Mock data - in production, this would come from API
const mockSessions = [
  {
    sessionId: '123e4567-e89b-12d3-a456-426614174000',
    status: 'created',
    mentorId: 'mentor-001',
    patientId: 'patient-001',
    plannedDuration: 60,
  },
  {
    sessionId: '223e4567-e89b-12d3-a456-426614174001',
    status: 'started',
    mentorId: 'mentor-002',
    patientId: 'patient-002',
    plannedDuration: 45,
  },
  {
    sessionId: '323e4567-e89b-12d3-a456-426614174002',
    status: 'ended',
    mentorId: 'mentor-003',
    patientId: 'patient-003',
    plannedDuration: 90,
  },
];

export const SessionListPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="wave-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-heading text-text-grey">Sessions</h1>
          <Button variant="primary" size="lg" onClick={() => navigate('/sessions/create')}>
            Start New Session
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {mockSessions.map((session) => (
            <SessionCard
              key={session.sessionId}
              sessionId={session.sessionId}
              status={session.status}
              mentorId={session.mentorId}
              patientId={session.patientId}
              plannedDuration={session.plannedDuration}
              onViewDetails={() => navigate(`/sessions/${session.sessionId}`)}
              onJoin={() => navigate(`/sessions/${session.sessionId}/join`)}
              onStart={() => navigate(`/sessions/${session.sessionId}/prestart`)}
              onEnd={() => navigate(`/sessions/${session.sessionId}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};






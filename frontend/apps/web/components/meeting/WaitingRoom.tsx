'use client';

import { useEffect, useState } from 'react';
import { Button, Card } from '@/components/ui';
import { useLiveKit } from '@/contexts/LiveKitContext';
import { useSession } from '@/hooks/useSession';
import { LocalParticipant } from 'livekit-client';

interface WaitingRoomProps {
  onStart: () => void;
  userRole: 'MENTOR' | 'MENTEE';
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ onStart, userRole }) => {
  const { participants, isConnected, room } = useLiveKit();
  const { startSession } = useSession();
  const [readyCount, setReadyCount] = useState(0);

  useEffect(() => {
    // Count connected participants (at least 1 - yourself)
    const count = Math.max(participants.length, 1);
    setReadyCount(count);
  }, [participants, isConnected]);

  const handleStart = async () => {
    if (userRole === 'MENTOR') {
      try {
        await startSession();
        onStart();
      } catch (error) {
        console.error('Failed to start session:', error);
        // Still allow starting even if API call fails (for testing)
        onStart();
      }
    }
  };

  // Allow starting with at least 1 participant (yourself) for testing
  // In production, you might want readyCount >= 2
  const canStart = userRole === 'MENTOR' && readyCount >= 1;

  const isLocalParticipant = (participant: any) => {
    return participant instanceof LocalParticipant || participant === room?.localParticipant;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-soft-white p-4">
      <Card className="w-full max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold text-primary-purple">Waiting Room</h1>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-2xl font-semibold text-text-grey">
              {readyCount}/2 Ready
            </p>
            <p className="mt-2 text-text-grey">
              {readyCount < 2
                ? 'Waiting for other participants... (You can start with just yourself for testing)'
                : 'All participants are ready!'}
            </p>
            {!isConnected && (
              <p className="mt-2 text-sm text-yellow-600">
                Connection status: Connecting... (This is normal for local testing)
              </p>
            )}
            {isConnected && (
              <p className="mt-2 text-sm text-green-600">
                ✓ Connected to room
              </p>
            )}
          </div>

          {/* Participant List */}
          <div className="space-y-2">
            {participants.length > 0 ? (
              participants.map((participant, index) => (
                <div
                  key={participant.identity || index}
                  className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-purple flex items-center justify-center text-white font-semibold">
                    {participant.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-medium">{participant.name || 'Unknown'}</p>
                    <p className="text-sm text-text-grey">
                      {isLocalParticipant(participant) ? 'You' : 'Other participant'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary-purple flex items-center justify-center text-white font-semibold">
                  U
                </div>
                <div>
                  <p className="font-medium">You (Connecting...)</p>
                  <p className="text-sm text-text-grey">Waiting for connection...</p>
                </div>
              </div>
            )}
          </div>

          {/* Start Button (Mentor only) */}
          {userRole === 'MENTOR' && (
            <Button
              onClick={handleStart}
              disabled={!canStart}
              className="w-full"
            >
              {canStart ? 'Start Session' : 'Waiting for participants...'}
            </Button>
          )}

          {userRole === 'MENTEE' && (
            <p className="text-center text-text-grey">
              Waiting for mentor to start the session...
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};


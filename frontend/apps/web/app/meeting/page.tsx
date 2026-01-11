'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PreSessionCheck, ActiveSession } from '@/components/meeting';
import { useLiveKit } from '@/contexts/LiveKitContext';
import { useSession } from '@/hooks/useSession';

type MeetingStage = 'check' | 'active' | 'ended';

export default function MeetingPage() {
  const router = useRouter();
  const [stage, setStage] = useState<MeetingStage>('check');
  const [userRole, setUserRole] = useState<'MENTOR' | 'MENTEE'>('MENTEE');
  const { connect, disconnect } = useLiveKit();
  const { fetchJoinToken, loading: tokenLoading } = useSession();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token) {
      router.push('/login');
      return;
    }

    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
    }
  }, [router]);

  const handleJoin = async () => {
    try {
      console.log('Fetching join token...');
      const tokenData = await fetchJoinToken();
      if (tokenData && tokenData.url && tokenData.token) {
        console.log('Join token received, connecting to room...', { 
          url: tokenData.url, 
          roomName: tokenData.roomName,
          hasToken: !!tokenData.token 
        });
        
        // Check if LiveKit URL is configured
        if (!tokenData.url || tokenData.url === 'wss://your-livekit-server.com') {
          alert('LiveKit server is not configured. Please configure LIVEKIT_URL in backend .env file.');
          return;
        }
        
        // Try to connect, but don't block if it fails
        try {
          await connect(tokenData.url, tokenData.token);
          console.log('Connected to room, moving to active session');
        } catch (connectError) {
          console.warn('Connection error (continuing anyway):', connectError);
          // Continue to meeting even if connection has issues
          // The connection might recover or work for audio-only
        }
        
        // Go directly to active session (skip waiting room)
        setStage('active');
      } else {
        console.error('Failed to get join token or invalid token data');
        alert('Failed to get join token. Please check your connection and try again.');
      }
    } catch (error) {
      console.error('Failed to join:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Still allow entering meeting even if there's an error
      console.warn('Proceeding to meeting despite error');
      setStage('active');
    }
  };

  const handleEnd = async () => {
    await disconnect();
    setStage('ended');
    // Redirect to home after a delay
    setTimeout(() => {
      router.push('/');
    }, 3000);
  };

  if (tokenLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-text-grey text-sm sm:text-base">Loading...</p>
      </div>
    );
  }

  switch (stage) {
    case 'check':
      return <PreSessionCheck onJoin={handleJoin} />;
    case 'active':
      return <ActiveSession onEnd={handleEnd} />;
    case 'ended':
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <p className="text-text-grey text-sm sm:text-base text-center">Session ended. Redirecting...</p>
        </div>
      );
    default:
      return <PreSessionCheck onJoin={handleJoin} />;
  }
}


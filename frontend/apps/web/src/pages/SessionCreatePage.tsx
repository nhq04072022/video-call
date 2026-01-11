/**
 * Start Session Page - Instant session creation like Google Meet
 * Just click a button to start a session immediately
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { sessionApi } from '../services/api';
import { useSessionStore } from '../stores/sessionStore';
import { useAuth } from '../hooks/useAuth';
import { bookingApi } from '../services/bookingApi';
import { mentorApi } from '../services/mentorApi';

export const SessionCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setCurrentSessionId = useSessionStore((state) => state.setCurrentSessionId);

  const handleStartInstantSession = async () => {
    if (!user) {
      setError('Please log in to start a session');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate user has an ID
      if (!user?.id) {
        throw new Error('User ID is missing. Please log in again.');
      }

      let mentorId: string = user.id;
      let menteeId: string = user.id;

      // Determine roles: if user is mentee, find an available mentor
      if (user.role === 'mentee' || user.role === 'MENTEE') {
        menteeId = user.id;
        // Find first available mentor
        try {
          const mentors = await mentorApi.searchMentors({ limit: 1 });
          if (mentors.mentors && mentors.mentors.length > 0 && mentors.mentors[0].id) {
            mentorId = mentors.mentors[0].id;
          } else {
            // If no mentor found, use current user as both (self-session)
            mentorId = user.id;
          }
        } catch (err) {
          // Fallback: use current user as both
          mentorId = user.id;
        }
      } else {
        // User is mentor
        mentorId = user.id;
        // Mentee will join later, use current user as placeholder
        menteeId = user.id;
      }

      // Validate mentorId is set
      if (!mentorId) {
        throw new Error('Failed to determine mentor ID. Please try again.');
      }

      // Create a temporary booking for instant session
      // Try multiple time slots to avoid conflicts (instant sessions may overlap)
      let booking;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          // Use a time slot with random offset to avoid conflicts
          const now = new Date();
          // Random offset between 60-180 minutes (1-3 hours) to avoid conflicts
          // Increase base time for each retry
          const baseMinutes = 60 + (retryCount * 30); // Start at 1 hour, add 30 min per retry
          const randomMinutes = baseMinutes + Math.floor(Math.random() * 60);
          const futureTime = new Date(now.getTime() + randomMinutes * 60 * 1000);
          
          // Ensure all required fields are present
          const bookingData: {
            mentor_id: string;
            scheduled_start_time: string;
            duration_minutes: number;
            notes: string;
          } = {
            mentor_id: mentorId, // Explicitly ensure this is a string
            scheduled_start_time: futureTime.toISOString(),
            duration_minutes: 60,
            notes: 'Instant session - created automatically',
          };

          // Validate bookingData before sending
          if (!bookingData.mentor_id) {
            throw new Error(`Invalid booking data: mentor_id is ${bookingData.mentor_id}`);
          }

          // Create booking
          booking = await bookingApi.createBooking(bookingData);
          break; // Success, exit retry loop
        } catch (bookingErr: any) {
          retryCount++;
          if (retryCount >= maxRetries || !bookingErr.response?.data?.detail?.includes('already booked')) {
            throw bookingErr; // Re-throw if not a slot conflict or max retries reached
          }
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (!booking) {
        throw new Error('Failed to create booking after multiple attempts');
      }
      
      // Auto-confirm booking if user is mentor
      let confirmedBooking = booking;
      if (user.role === 'mentor' && booking.status === 'pending') {
        try {
          confirmedBooking = await bookingApi.confirmBooking(booking.id);
        } catch (confirmErr: any) {
          console.warn('Failed to auto-confirm booking, using booking as-is:', confirmErr);
          // Continue with unconfirmed booking - session creation may still work
        }
      }
      
      // Create session from booking
      const session = await sessionApi.createSessionFromBooking(confirmedBooking.id);
      
      // Store session ID
      setCurrentSessionId(session.session_id);
      
      // Navigate to share page
      navigate('/sessions/share', { replace: true });
    } catch (err: any) {
      console.error('Failed to start instant session:', err);
      let errorMessage = 'Failed to start session. ';
      
      // Extract error message from various possible locations
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        // Handle if detail is an object
        if (typeof detail === 'object') {
          errorMessage += JSON.stringify(detail);
        } else {
          errorMessage += detail;
        }
      } else if (err.response?.data?.message) {
        const message = err.response.data.message;
        if (typeof message === 'object') {
          errorMessage += JSON.stringify(message);
        } else {
          errorMessage += message;
        }
      } else if (err.response?.data?.error) {
        const error = err.response.data.error;
        if (typeof error === 'object') {
          errorMessage += JSON.stringify(error);
        } else {
          errorMessage += error;
        }
      } else if (err.message) {
        errorMessage += err.message;
      } else if (typeof err === 'string') {
        errorMessage += err;
      } else {
        errorMessage += 'Please check if backend services are running.';
      }
      
      // Check for network errors
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || err.message?.includes('CONNECTION_REFUSED')) {
        errorMessage = 'Cannot connect to backend services. Please ensure all backend services are running on ports 8000-8003.';
      }
      
      // Clean up the message - remove common prefixes
      errorMessage = errorMessage.replace(/^Failed to start session\.\s*/, '');
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wave-background min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-card-lg shadow-2xl p-12 animate-fade-in">
            {/* Icon */}
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary-purple to-primary-purple-accent flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-heading text-text-grey mb-4">
              Start a Session
            </h1>

            {/* Description */}
            <p className="text-gray-600 mb-8">
              Click the button below to instantly create a new session. You'll receive a code to share with participants.
            </p>

            {/* Error message */}
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-card"
              >
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            {/* Start Button */}
            <Button
              onClick={handleStartInstantSession}
              disabled={isLoading}
              variant="primary"
              size="lg"
              className="w-full mb-4"
              aria-label={isLoading ? 'Starting session...' : 'Start new session'}
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
                  Starting Session...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start New Session
                </span>
              )}
            </Button>

            {/* Info */}
            <p className="text-sm text-gray-500">
              Just like Google Meet - instant session creation, no forms needed!
            </p>
          </div>
        </div>
      </div>
  );
};

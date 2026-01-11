/**
 * Session Join Page - Allows users to join a session with device testing and consent
 */
import React, { useState, FormEvent, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { DeviceTesting } from '../components/features/sessions/DeviceTesting';
import { Button } from '../components/ui/Button';
import { useLiveKit } from '../hooks/useLiveKit';
import { useAuth } from '../hooks/useAuth';
import { useSessionStore } from '../stores/sessionStore';

export const SessionJoinPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const setCurrentSessionId = useSessionStore((state) => state.setCurrentSessionId);
  
  // Redirect if no session ID in store
  useEffect(() => {
    if (!currentSessionId) {
      navigate('/sessions');
    }
  }, [currentSessionId, navigate]);

  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devicesReady, setDevicesReady] = useState(false);

  // LiveKit hook
  const deviceInfoString = useMemo(() => {
    if (selectedCameraId && selectedMicrophoneId) {
      return JSON.stringify({
        cameraId: selectedCameraId,
        microphoneId: selectedMicrophoneId,
      });
    }
    return undefined;
  }, [selectedCameraId, selectedMicrophoneId]);

  const { connect, isConnecting } = useLiveKit({
    sessionId: currentSessionId || '',
    participantRole: (user?.role as 'mentor' | 'patient') || 'patient',
    deviceInfo: deviceInfoString,
    onConnected: () => {
      navigate('/sessions/waiting');
    },
    onError: (err) => {
      setError(err.message || 'Failed to connect to session');
      setIsLoading(false);
    },
  });

  const handleDevicesSelected = (cameraId: string | null, micId: string | null) => {
    setSelectedCameraId(cameraId);
    setSelectedMicrophoneId(micId);
    setDevicesReady(!!cameraId && !!micId);
  };

  const handleJoin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!currentSessionId) {
      setError('Session ID is missing');
      navigate('/sessions');
      return;
    }

    if (!consentChecked) {
      setError('Please agree to the consent terms to continue');
      return;
    }

    if (!devicesReady) {
      setError('Please select both camera and microphone');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Connect to LiveKit (it will call getJoinToken internally with device info)
      await connect();
      
      // Navigation will happen in onConnected callback
      // Note: If connection succeeds, onConnected will navigate
      // If it fails, error will be caught below
    } catch (err: any) {
      console.error('Join session error:', err);
      let errorMessage = 'Failed to join session. ';
      
      if (err?.message) {
        errorMessage += err.message;
      } else if (err?.response?.data?.detail) {
        errorMessage += err.response.data.detail;
      } else if (err?.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else {
        errorMessage += 'Please check your network connection and try again.';
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const canJoin = consentChecked && devicesReady && !isLoading && !isConnecting;

  return (
    <MainLayout title="Join Session">
      <div className="max-w-4xl mx-auto wave-background">
        <div className="bg-white rounded-card-lg shadow-2xl p-8 space-y-8 animate-fade-in">
          {/* Session Info Header */}
          <div className="text-center border-b border-gray-200 pb-6">
            <h2 className="text-3xl font-heading text-text-grey mb-2">
              Join Session
            </h2>
            <p className="text-base text-gray-600">
              Session ID: <span className="font-mono text-primary-purple">{currentSessionId?.slice(0, 8)}...</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Please test your devices and confirm your consent before joining the session.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-4 bg-red-50 border border-red-200 rounded-card"
            >
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-8" noValidate>
            {/* Device Testing Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-heading text-text-grey mb-2">
                Test Your Devices
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Select your camera and microphone, then preview them before joining.
              </p>
              <DeviceTesting
                onDevicesSelected={handleDevicesSelected}
                selectedCameraId={selectedCameraId}
                selectedMicrophoneId={selectedMicrophoneId}
              />
            </div>

            {/* Consent Section */}
            <div className="bg-gray-50 rounded-card p-6 border-2 border-gray-200">
              <h3 className="text-lg font-heading text-text-grey mb-4">
                Consent & Agreement
              </h3>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    id="consent-checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="h-5 w-5 text-primary-purple focus:ring-primary-purple border-gray-300 rounded min-h-[44px] min-w-[44px] p-2"
                    aria-required="true"
                    aria-invalid={!consentChecked ? 'true' : 'false'}
                    aria-describedby="consent-description"
                    disabled={isLoading}
                  />
                </div>
                <label
                  htmlFor="consent-checkbox"
                  className="ml-3 text-base text-text-grey cursor-pointer min-h-[44px] flex items-start pt-1"
                >
                  <div>
                    <span className="font-semibold block mb-1">
                      I agree to participate in this session
                    </span>
                    <span className="text-sm text-gray-600 block">
                      and understand that the session may be recorded for quality
                      assurance and training purposes. I consent to the use of my video and audio during this session.
                    </span>
                  </div>
                </label>
              </div>
              <p id="consent-description" className="sr-only">
                You must agree to the consent terms to join the session
              </p>
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-card border-2 ${
                devicesReady 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {devicesReady ? (
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className={`font-semibold text-sm ${
                    devicesReady ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    Devices {devicesReady ? 'Ready' : 'Not Selected'}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {devicesReady 
                    ? 'Camera and microphone selected' 
                    : 'Please select both camera and microphone'}
                </p>
              </div>

              <div className={`p-4 rounded-card border-2 ${
                consentChecked 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {consentChecked ? (
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className={`font-semibold text-sm ${
                    consentChecked ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    Consent {consentChecked ? 'Confirmed' : 'Required'}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {consentChecked 
                    ? 'You have agreed to participate' 
                    : 'Please confirm your consent to continue'}
                </p>
              </div>
            </div>

            {/* Join Button */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate(-1)}
                disabled={isLoading || isConnecting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!canJoin}
                className="flex-1"
                aria-label={isLoading || isConnecting ? 'Joining session...' : 'Join Session'}
              >
                {isLoading || isConnecting ? (
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
                    Joining Session...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Join Session
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};


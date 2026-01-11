'use client';

import { useState, useEffect, useRef } from 'react';
import { Button, Card } from '@/components/ui';

interface PreSessionCheckProps {
  onJoin: () => void;
}

export const PreSessionCheck: React.FC<PreSessionCheckProps> = ({ onJoin }) => {
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Try to request camera and microphone access (optional)
    const initDevices = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        streamRef.current = stream;
        setCameraEnabled(true);
        setMicrophoneEnabled(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        // Camera/microphone not available, but that's okay - user can still join
        setCameraEnabled(false);
        setMicrophoneEnabled(false);
        console.log('Camera/microphone not available:', err.message);
      }
    };

    initDevices();

    // Cleanup
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Only require consent, camera and microphone are optional
  const canJoin = consentGiven;

  const handleJoin = () => {
    if (canJoin) {
      // Stop the preview stream if it exists
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      onJoin();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-soft-white p-4 sm:p-6">
      <Card className="w-full max-w-2xl">
        <h1 className="mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold text-primary-purple">Pre-Session Check</h1>

        <div className="space-y-6">
          {/* Video Preview */}
          <div className="relative w-full rounded-lg overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!cameraEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
                Camera not available (optional)
              </div>
            )}
          </div>

          {/* Device Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  cameraEnabled ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />
              <span className="text-sm sm:text-base">Camera: {cameraEnabled ? 'Ready' : 'Optional - Not Available'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  microphoneEnabled ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />
              <span className="text-sm sm:text-base">Microphone: {microphoneEnabled ? 'Ready' : 'Optional - Not Available'}</span>
            </div>
            <p className="text-xs sm:text-sm text-text-grey mt-2">
              Note: Camera and microphone are optional. You can join without them.
            </p>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="w-5 h-5"
            />
            <span>I agree to the terms and conditions</span>
          </label>

          {error && (
            <p className="text-sm text-yellow-600">
              {error} - You can still join without camera/microphone.
            </p>
          )}

          {/* Join Button */}
          <Button
            onClick={handleJoin}
            disabled={!canJoin}
            className="w-full"
          >
            Join Session
          </Button>
        </div>
      </Card>
    </div>
  );
};


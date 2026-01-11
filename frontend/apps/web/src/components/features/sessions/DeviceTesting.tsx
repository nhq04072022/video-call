/**
 * Device Testing Component - Allows users to select and preview camera/microphone
 */
import React, { useState, useEffect, useRef } from 'react';

interface DeviceTestingProps {
  onDevicesSelected?: (cameraId: string | null, microphoneId: string | null) => void;
  selectedCameraId?: string | null;
  selectedMicrophoneId?: string | null;
}

export const DeviceTesting: React.FC<DeviceTestingProps> = ({
  onDevicesSelected,
  selectedCameraId: initialCameraId,
  selectedMicrophoneId: initialMicrophoneId,
}) => {
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(initialCameraId || null);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string | null>(initialMicrophoneId || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Enumerate devices
  useEffect(() => {
    const enumerateDevices = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Request permission first by getting user media
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          // Stop temp stream
          tempStream.getTracks().forEach((track) => track.stop());
          setHasPermission(true);
        } catch (permError: any) {
          if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
            setHasPermission(false);
            setError('Camera and microphone permissions are required. Please allow access and refresh.');
            setIsLoading(false);
            return;
          }
          throw permError;
        }

        // Enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((d) => d.kind === 'videoinput');
        const microphones = devices.filter((d) => d.kind === 'audioinput');

        setAvailableCameras(cameras);
        setAvailableMicrophones(microphones);

        // Set default selections if not provided
        if (!selectedCameraId && cameras.length > 0) {
          setSelectedCameraId(cameras[0].deviceId);
        }
        if (!selectedMicrophoneId && microphones.length > 0) {
          setSelectedMicrophoneId(microphones[0].deviceId);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to enumerate devices');
      } finally {
        setIsLoading(false);
      }
    };

    enumerateDevices();
  }, []);

  // Update preview when device selection changes
  useEffect(() => {
    const updatePreview = async () => {
      // Stop previous stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (!videoRef.current || !hasPermission) return;

      try {
        const constraints: MediaStreamConstraints = {
          video: selectedCameraId
            ? { deviceId: { exact: selectedCameraId } }
            : false,
          audio: selectedMicrophoneId
            ? { deviceId: { exact: selectedMicrophoneId } }
            : false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => {
            console.error('Error playing video:', err);
          });
        }

        // Notify parent component
        if (onDevicesSelected) {
          onDevicesSelected(selectedCameraId, selectedMicrophoneId);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to access selected device');
      }
    };

    if (selectedCameraId || selectedMicrophoneId) {
      updatePreview();
    }

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [selectedCameraId, selectedMicrophoneId, hasPermission, onDevicesSelected]);

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value || null;
    setSelectedCameraId(deviceId);
  };

  const handleMicrophoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value || null;
    setSelectedMicrophoneId(deviceId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-purple mx-auto mb-4" />
          <p className="text-text-grey">Loading devices...</p>
        </div>
      </div>
    );
  }

  if (error && !hasPermission) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="p-4 bg-red-50 border border-red-200 rounded-card"
      >
        <p className="text-sm font-medium text-red-800">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 text-sm font-medium text-red-600 underline hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg min-h-[44px] min-w-[44px]"
          aria-label="Refresh page to retry device access"
        >
          Refresh page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && hasPermission && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 bg-yellow-50 border border-yellow-200 rounded-card"
        >
          <p className="text-sm font-medium text-yellow-800">{error}</p>
        </div>
      )}

      {/* Device Selection */}
      <div className="space-y-4">
        {/* Camera Selection */}
        <div>
          <label
            htmlFor="camera-select"
            className="block text-sm font-medium text-text-grey mb-2"
          >
            Camera
          </label>
          <select
            id="camera-select"
            value={selectedCameraId || ''}
            onChange={handleCameraChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent min-h-[44px]"
            aria-label="Select camera device"
            aria-describedby="camera-description"
          >
            {availableCameras.length === 0 ? (
              <option value="">No cameras available</option>
            ) : (
              <>
                <option value="">Select a camera</option>
                {availableCameras.map((camera) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </>
            )}
          </select>
          <p id="camera-description" className="sr-only">
            Select your preferred camera device
          </p>
        </div>

        {/* Microphone Selection */}
        <div>
          <label
            htmlFor="microphone-select"
            className="block text-sm font-medium text-text-grey mb-2"
          >
            Microphone
          </label>
          <select
            id="microphone-select"
            value={selectedMicrophoneId || ''}
            onChange={handleMicrophoneChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent min-h-[44px]"
            aria-label="Select microphone device"
            aria-describedby="microphone-description"
          >
            {availableMicrophones.length === 0 ? (
              <option value="">No microphones available</option>
            ) : (
              <>
                <option value="">Select a microphone</option>
                {availableMicrophones.map((mic) => (
                  <option key={mic.deviceId} value={mic.deviceId}>
                    {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </>
            )}
          </select>
          <p id="microphone-description" className="sr-only">
            Select your preferred microphone device
          </p>
        </div>
      </div>

      {/* Video Preview */}
      <div>
        <label className="block text-sm font-medium text-text-grey mb-2">
          Preview
        </label>
        <div className="relative bg-gray-900 rounded-card overflow-hidden aspect-video">
          {selectedCameraId ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              aria-label="Camera preview"
              style={{ transform: 'scaleX(-1)' }} // Mirror effect for local video
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm">Select a camera to preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


/**
 * VideoControls Component - Brand Colors (#A11692)
 * Pill-shaped buttons with proper WCAG focus states
 */
import React from 'react';

interface VideoControlsProps {
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onEndSession: () => void;
  onEmergencyTerminate: () => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onEndSession,
  onEmergencyTerminate,
}) => {
  // Brand colors
  const primaryPurple = '#A11692';
  
  return (
    <div className="flex justify-center">
      <div 
        className="flex items-center gap-2 sm:gap-3 bg-white px-4 sm:px-6 py-3 sm:py-4 shadow-2xl"
        style={{ borderRadius: '9999px' }}
        role="toolbar"
        aria-label="Video call controls"
      >
        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          aria-pressed={isMuted}
          className="flex flex-col items-center gap-1 sm:gap-1.5 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full p-1"
          style={{ '--tw-ring-color': primaryPurple } as React.CSSProperties}
        >
          <div 
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: isMuted ? '#6B7280' : primaryPurple }}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMuted ? (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </>
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </div>
          <span className="text-xs font-medium" style={{ color: '#514B50' }}>Mute</span>
        </button>

        {/* Video Button */}
        <button
          onClick={onToggleVideo}
          aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          aria-pressed={!isVideoEnabled}
          className="flex flex-col items-center gap-1 sm:gap-1.5 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full p-1"
          style={{ '--tw-ring-color': primaryPurple } as React.CSSProperties}
        >
          <div 
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: isVideoEnabled ? primaryPurple : '#6B7280' }}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              {!isVideoEnabled && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />}
            </svg>
          </div>
          <span className="text-xs font-medium" style={{ color: '#514B50' }}>Video</span>
        </button>

        {/* Screen Share Button */}
        <button
          onClick={onToggleScreenShare}
          aria-label={isScreenSharing ? 'Stop screen share' : 'Share screen'}
          aria-pressed={isScreenSharing}
          className="flex flex-col items-center gap-1 sm:gap-1.5 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full p-1"
          style={{ '--tw-ring-color': primaryPurple } as React.CSSProperties}
        >
          <div 
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: isScreenSharing ? '#28a745' : primaryPurple }}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xs font-medium" style={{ color: '#514B50' }}>Share</span>
        </button>

        {/* Divider */}
        <div className="w-px h-10 bg-gray-200 mx-1 hidden sm:block" />

        {/* End Session Button */}
        <button
          onClick={onEndSession}
          aria-label="End session"
          className="flex flex-col items-center gap-1 sm:gap-1.5 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-full p-1"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gray-500 hover:bg-gray-600 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <span className="text-xs font-medium" style={{ color: '#514B50' }}>End</span>
        </button>

        {/* Emergency Terminate Button - Pill shape */}
        <button
          onClick={onEmergencyTerminate}
          aria-label="Emergency terminate session"
          className="hidden sm:flex items-center gap-2 px-5 py-2.5 text-white font-medium transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ml-1"
          style={{ 
            backgroundColor: '#dc3545',
            borderRadius: '9999px'
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm whitespace-nowrap">Emergency</span>
        </button>
      </div>
    </div>
  );
};

export default VideoControls;

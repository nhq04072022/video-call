/**
 * Network Quality Badge Component - Displays connection quality from LiveKit
 */
import React from 'react';
import { ConnectionQuality } from 'livekit-client';

interface NetworkQualityBadgeProps {
  quality: ConnectionQuality | undefined;
  className?: string;
}

export const NetworkQualityBadge: React.FC<NetworkQualityBadgeProps> = ({
  quality,
  className = '',
}) => {
  if (!quality) {
    return null;
  }

  const getQualityConfig = (quality: ConnectionQuality) => {
    switch (quality) {
      case ConnectionQuality.Excellent:
        return {
          label: 'Excellent',
          color: 'bg-green-500',
          textColor: 'text-white',
          pulse: false,
        };
      case ConnectionQuality.Good:
        return {
          label: 'Good',
          color: 'bg-yellow-500',
          textColor: 'text-white',
          pulse: false,
        };
      case ConnectionQuality.Poor:
        return {
          label: 'Poor',
          color: 'bg-orange-500',
          textColor: 'text-white',
          pulse: true,
        };
      case ConnectionQuality.Lost:
        return {
          label: 'Connection Lost',
          color: 'bg-red-500',
          textColor: 'text-white',
          pulse: true,
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-500',
          textColor: 'text-white',
          pulse: false,
        };
    }
  };

  const config = getQualityConfig(quality);

  return (
    <div
      className={`${config.color} ${config.textColor} px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg ${
        config.pulse ? 'animate-pulse' : ''
      } ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`Connection quality: ${config.label}`}
      style={{ borderRadius: '20px' }}
    >
      <span
        className={`w-2 h-2 bg-white rounded-full ${config.pulse ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      <span className="text-xs font-semibold">{config.label}</span>
    </div>
  );
};


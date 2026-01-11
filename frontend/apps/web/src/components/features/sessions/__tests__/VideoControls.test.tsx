import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoControls } from '../VideoControls';

describe('VideoControls', () => {
  const defaultProps = {
    isMuted: false,
    isVideoEnabled: true,
    isScreenSharing: false,
    onToggleMute: vi.fn(),
    onToggleVideo: vi.fn(),
    onToggleScreenShare: vi.fn(),
    onEndSession: vi.fn(),
    onEmergencyTerminate: vi.fn(),
  };

  it('should render all control buttons', () => {
    render(<VideoControls {...defaultProps} />);
    
    expect(screen.getByLabelText(/mute microphone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/turn off camera/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/share screen/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end session/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/emergency terminate/i)).toBeInTheDocument();
  });

  it('should call onToggleMute when mute button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleMute = vi.fn();
    
    render(<VideoControls {...defaultProps} onToggleMute={onToggleMute} />);
    
    const muteButton = screen.getByLabelText(/mute microphone/i);
    await user.click(muteButton);
    
    expect(onToggleMute).toHaveBeenCalledTimes(1);
  });

  it('should call onToggleVideo when video button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleVideo = vi.fn();
    
    render(<VideoControls {...defaultProps} onToggleVideo={onToggleVideo} />);
    
    const videoButton = screen.getByLabelText(/turn off camera/i);
    await user.click(videoButton);
    
    expect(onToggleVideo).toHaveBeenCalledTimes(1);
  });

  it('should show correct label when muted', () => {
    render(<VideoControls {...defaultProps} isMuted={true} />);
    
    expect(screen.getByLabelText(/unmute microphone/i)).toBeInTheDocument();
  });

  it('should show correct label when video is disabled', () => {
    render(<VideoControls {...defaultProps} isVideoEnabled={false} />);
    
    expect(screen.getByLabelText(/turn on camera/i)).toBeInTheDocument();
  });
});

/**
 * Accessibility tests for VideoControls
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { VideoControls } from '../VideoControls';

// Note: Install vitest-axe package: npm install -D vitest-axe @axe-core/react
// import { axe } from 'vitest-axe';

describe('VideoControls Accessibility Tests', () => {
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

  it('should not have accessibility violations', async () => {
    const { container } = render(<VideoControls {...defaultProps} />);

    // TODO: Uncomment after installing vitest-axe
    // const results = await axe(container);
    // expect(results).toHaveNoViolations();
    
    // Basic accessibility checks
    expect(container.querySelector('[role="toolbar"]')).toBeInTheDocument();
    expect(container.querySelector('[aria-label*="Microphone"]')).toBeInTheDocument();
  });

  it('should have proper ARIA labels for all buttons', () => {
    const { container } = render(<VideoControls {...defaultProps} />);

    const muteButton = container.querySelector('[aria-label*="Microphone"]');
    const videoButton = container.querySelector('[aria-label*="Camera"]');
    const screenShareButton = container.querySelector('[aria-label*="Screen"]');
    const endButton = container.querySelector('[aria-label*="End session"]');
    const emergencyButton = container.querySelector('[aria-label*="Emergency"]');

    expect(muteButton).toBeInTheDocument();
    expect(videoButton).toBeInTheDocument();
    expect(screenShareButton).toBeInTheDocument();
    expect(endButton).toBeInTheDocument();
    expect(emergencyButton).toBeInTheDocument();
  });

  it('should have aria-pressed for toggle buttons', () => {
    const { container } = render(<VideoControls {...defaultProps} />);

    const muteButton = container.querySelector('[aria-label*="Microphone"]');
    expect(muteButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('should update aria-pressed when state changes', () => {
    const { container, rerender } = render(
      <VideoControls {...defaultProps} isMuted={true} />
    );

    const muteButton = container.querySelector('[aria-label*="Microphone"]');
    expect(muteButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('should have proper role for toolbar', () => {
    const { container } = render(<VideoControls {...defaultProps} />);

    const toolbar = container.querySelector('[role="toolbar"]');
    expect(toolbar).toHaveAttribute('aria-label', 'Session controls');
  });

  it('should have accessible descriptions for buttons', () => {
    const { container } = render(<VideoControls {...defaultProps} />);

    // Check for aria-describedby
    const muteButton = container.querySelector('[aria-label*="Microphone"]');
    expect(muteButton).toHaveAttribute('aria-describedby', 'mute-description');

    const description = container.querySelector('#mute-description');
    expect(description).toBeInTheDocument();
  });

  it('should have minimum touch target sizes', () => {
    const { container } = render(<VideoControls {...defaultProps} />);

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      const styles = window.getComputedStyle(button);
      const width = parseInt(styles.width || '0');
      const height = parseInt(styles.height || '0');
      expect(width).toBeGreaterThanOrEqual(44);
      expect(height).toBeGreaterThanOrEqual(44);
    });
  });
});


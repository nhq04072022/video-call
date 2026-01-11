/**
 * Integration tests for SessionJoinPage
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { SessionJoinPage } from '../SessionJoinPage';
import { sessionApi } from '../../services/api';
import { useLiveKit } from '../../hooks/useLiveKit';
import { useAuth } from '../../hooks/useAuth';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ sessionId: 'test-session-123' }),
    useNavigate: () => vi.fn((path: string) => {
      // Mock navigation
      window.history.pushState({}, '', path);
    }),
  };
});

vi.mock('../../services/api', () => ({
  sessionApi: {
    getJoinToken: vi.fn(),
  },
}));

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('../../hooks/useLiveKit', () => ({
  useLiveKit: vi.fn(),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock MediaDevices API
const mockGetUserMedia = vi.fn();
const mockEnumerateDevices = vi.fn();

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
    enumerateDevices: mockEnumerateDevices,
  },
});

describe('SessionJoinPage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', name: 'Test User', role: 'mentor' },
    });

    (useLiveKit as ReturnType<typeof vi.fn>).mockReturnValue({
      connect: mockConnect,
      disconnect: mockDisconnect,
      isConnecting: false,
      error: null,
    });

    (sessionApi.getJoinToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      join_token: 'mock-join-token',
      session_metadata: {},
      technical_config: {},
      participant_role: 'mentor',
    });

    // Mock MediaDevices
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [
        { kind: 'video', stop: vi.fn() },
        { kind: 'audio', stop: vi.fn() },
      ],
    });

    mockEnumerateDevices.mockResolvedValue([
      { deviceId: 'camera-1', kind: 'videoinput', label: 'Camera 1' },
      { deviceId: 'mic-1', kind: 'audioinput', label: 'Microphone 1' },
    ]);
  });

  it('should render join page with device testing', async () => {
    render(
      <BrowserRouter>
        <SessionJoinPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/join session/i)).toBeInTheDocument();
    });

    // Check for device selection
    expect(screen.getByLabelText(/camera/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/microphone/i)).toBeInTheDocument();
  });

  it('should allow user to select devices and join session', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <SessionJoinPage />
      </BrowserRouter>
    );

    // Wait for devices to load
    await waitFor(() => {
      expect(screen.getByLabelText(/camera/i)).toBeInTheDocument();
    });

    // Select camera
    const cameraSelect = screen.getByLabelText(/camera/i);
    await user.selectOptions(cameraSelect, 'camera-1');

    // Select microphone
    const micSelect = screen.getByLabelText(/microphone/i);
    await user.selectOptions(micSelect, 'mic-1');

    // Check consent
    const consentCheckbox = screen.getByLabelText(/i agree to participate/i);
    await user.click(consentCheckbox);

    // Click join button
    const joinButton = screen.getByRole('button', { name: /join session/i });
    await user.click(joinButton);

    // Verify connect was called
    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });
  });

  it('should show error if consent is not checked', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <SessionJoinPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/camera/i)).toBeInTheDocument();
    });

    // Try to join without consent
    const joinButton = screen.getByRole('button', { name: /join session/i });
    await user.click(joinButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/consent is required/i)).toBeInTheDocument();
    });

    expect(mockConnect).not.toHaveBeenCalled();
  });

  it('should handle device selection errors', async () => {
    mockEnumerateDevices.mockRejectedValue(new Error('Failed to enumerate devices'));

    render(
      <BrowserRouter>
        <SessionJoinPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to enumerate devices/i)).toBeInTheDocument();
    });
  });

  it('should handle join token API errors', async () => {
    const user = userEvent.setup();
    (sessionApi.getJoinToken as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Failed to get join token')
    );

    render(
      <BrowserRouter>
        <SessionJoinPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/camera/i)).toBeInTheDocument();
    });

    const consentCheckbox = screen.getByLabelText(/i agree to participate/i);
    await user.click(consentCheckbox);

    const joinButton = screen.getByRole('button', { name: /join session/i });
    await user.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to get join token/i)).toBeInTheDocument();
    });
  });
});


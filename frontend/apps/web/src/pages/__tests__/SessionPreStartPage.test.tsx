import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { SessionPreStartPage } from '../SessionPreStartPage';
import { useSessionStatus } from '../../hooks/useSessionStatus';
import { useAuth } from '../../hooks/useAuth';
import { sessionApi } from '../../services/api';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ sessionId: 'test-session-123' }),
    useNavigate: () => vi.fn((path: string) => {
      window.history.pushState({}, '', path);
    }),
  };
});

vi.mock('../../hooks/useSessionStatus', () => ({
  useSessionStatus: vi.fn(),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  sessionApi: {
    startSession: vi.fn(),
  },
}));

describe('SessionPreStartPage Integration Tests', () => {
  const mockParticipants = [
    {
      id: 'participant-1',
      role: 'mentor',
      display_name: 'Mentor User',
    },
    {
      id: 'participant-2',
      role: 'patient',
      display_name: 'Patient User',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'user-1', email: 'mentor@example.com', name: 'Mentor', role: 'mentor' },
    });

    (useSessionStatus as ReturnType<typeof vi.fn>).mockReturnValue({
      participants: mockParticipants,
      readyCount: 2,
      isLoading: false,
      error: null,
    });

    (sessionApi.startSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      session_started: true,
      start_timestamp: new Date().toISOString(),
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <SessionPreStartPage />
      </BrowserRouter>
    );
  };

  it('should render waiting room with participant information', () => {
    renderComponent();
    expect(screen.getByText('Lifely')).toBeInTheDocument();
    expect(screen.getByText(/Participants: 2\/2 Ready/i)).toBeInTheDocument();
  });

  it('should enable Start Session button when 2/2 participants are ready', () => {
    renderComponent();
    const startButton = screen.getByRole('button', { name: /start session/i });
    expect(startButton).not.toBeDisabled();
  });

  it('should disable Start Session button when not all participants are ready', () => {
    (useSessionStatus as ReturnType<typeof vi.fn>).mockReturnValue({
      participants: [mockParticipants[0]],
      readyCount: 1,
      isLoading: false,
      error: null,
    });

    renderComponent();
    const startButton = screen.getByRole('button', { name: /waiting for participants/i });
    expect(startButton).toBeDisabled();
  });

  it('should show polling status updates', async () => {
    let callCount = 0;
    (useSessionStatus as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return {
        participants: callCount === 1 ? [mockParticipants[0]] : mockParticipants,
        readyCount: callCount === 1 ? 1 : 2,
        isLoading: false,
        error: null,
      };
    });

    const { rerender } = renderComponent();

    // Initially 1/2
    expect(screen.getByText(/Participants: 1\/2 Ready/i)).toBeInTheDocument();

    // Simulate status update
    rerender(
      <BrowserRouter>
        <SessionPreStartPage />
      </BrowserRouter>
    );

    // Should update to 2/2
    await waitFor(() => {
      expect(screen.getByText(/Participants: 2\/2 Ready/i)).toBeInTheDocument();
    });
  });

  it('should show timeout error after 5 minutes', async () => {
    vi.useFakeTimers();
    
    (useSessionStatus as ReturnType<typeof vi.fn>).mockReturnValue({
      participants: [mockParticipants[0]],
      readyCount: 1,
      isLoading: false,
      error: null,
    });

    renderComponent();

    // Fast-forward 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000);

    await waitFor(() => {
      expect(screen.getByText(/timeout/i)).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('should only allow mentor to start session', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'user-2', email: 'patient@example.com', name: 'Patient', role: 'patient' },
    });

    renderComponent();
    const startButton = screen.getByRole('button', { name: /start session/i });
    expect(startButton).toBeDisabled();
    expect(screen.getByText(/only the mentor can start/i)).toBeInTheDocument();
  });

  it('should show cancel button', () => {
    renderComponent();
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
  });
});

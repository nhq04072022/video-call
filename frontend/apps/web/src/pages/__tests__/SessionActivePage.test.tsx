import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { SessionActivePage } from '../SessionActivePage';

// Mock useParams and useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ sessionId: 'test-session-123' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock useLiveKit hook
const mockUseLiveKit = {
  participants: [],
  localParticipant: null,
  isConnected: true,
  isConnecting: false,
  error: null,
  connectionQuality: 'Excellent' as const,
  connect: vi.fn(),
  disconnect: vi.fn(),
  toggleMute: vi.fn(),
  toggleVideo: vi.fn(),
  isMuted: false,
  isVideoEnabled: true,
};

vi.mock('../../hooks/useLiveKit', () => ({
  useLiveKit: () => mockUseLiveKit,
}));

// Mock sessionApi
const mockEndSession = vi.fn();
const mockEmergencyTerminate = vi.fn();

vi.mock('../../services/api', () => ({
  sessionApi: {
    endSession: mockEndSession,
    emergencyTerminate: mockEmergencyTerminate,
  },
}));

// Mock useAuthStore
vi.mock('../../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      user: { id: 'user-1', email: 'test@example.com', name: 'Test User', role: 'mentor' },
    }),
  },
}));

describe('SessionActivePage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEndSession.mockResolvedValue({
      session_ended: true,
      end_timestamp: new Date().toISOString(),
      session_duration: 1800,
    });
    mockEmergencyTerminate.mockResolvedValue({
      session_terminated: true,
      termination_timestamp: new Date().toISOString(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <SessionActivePage />
      </BrowserRouter>
    );
  };

  it('should render header with Lifely logo and timer', () => {
    renderComponent();
    expect(screen.getByText('Lifely')).toBeInTheDocument();
    expect(screen.getByText(/SessionTimer:/i)).toBeInTheDocument();
  });

  it('should display recording and transcript indicators', () => {
    renderComponent();
    expect(screen.getAllByText(/REC/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Recording Active/i)).toBeInTheDocument();
    expect(screen.getByText(/Transcript Active/i)).toBeInTheDocument();
  });

  it('should show AI Insights panel', () => {
    renderComponent();
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
  });

  it('should display all control buttons', () => {
    renderComponent();
    expect(screen.getByLabelText(/mute microphone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/turn off camera/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/share screen/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end session/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/emergency terminate/i)).toBeInTheDocument();
  });

  it('should show success notification on mount', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByText(/Session started successfully/i).length).toBeGreaterThan(0);
    });
  });

  it('should format session timer correctly', () => {
    renderComponent();
    // Timer should be visible and show 00:00 or similar format
    const timer = screen.getByText(/SessionTimer:/i);
    expect(timer).toBeInTheDocument();
  });

  it('should open End Session Modal when End Session button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const endButton = screen.getByLabelText(/end session/i);
    await user.click(endButton);

    await waitFor(() => {
      expect(screen.getByText(/end session/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end reason/i)).toBeInTheDocument();
    });
  });

  it('should show connection quality badge', () => {
    mockUseLiveKit.connectionQuality = 'Excellent';
    renderComponent();
    // Connection quality should be displayed
    expect(screen.getByText(/excellent|good|poor/i)).toBeInTheDocument();
  });

  it('should toggle AI Panel when collapse button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const toggleButton = screen.getByLabelText(/collapse ai insights panel/i);
    await user.click(toggleButton);

    // Panel should be collapsed
    await waitFor(() => {
      expect(screen.queryByText(/ai insights/i)).not.toBeVisible();
    });
  });
});

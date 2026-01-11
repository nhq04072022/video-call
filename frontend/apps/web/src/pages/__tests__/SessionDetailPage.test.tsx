import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SessionDetailPage } from '../SessionDetailPage';
import { mockSessionId } from '../../test/api-mocks';

// Mock useParams and useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ sessionId: mockSessionId }),
    useNavigate: () => mockNavigate,
  };
});

// Mock sessionApi - define mocks inside factory to avoid hoisting
vi.mock('../../services/api', () => {
  const mockGetSessionStatus = vi.fn().mockResolvedValue({
    status: 'started',
    participants: [
      { id: 'user-1', display_name: 'You', role: 'Mentorship Provider' },
      { id: 'user-2', display_name: 'Alex Chen', role: 'Patient' },
    ],
  });

  const mockEndSession = vi.fn().mockResolvedValue({
    session_ended: true,
    end_timestamp: new Date().toISOString(),
  });
  
  // Store in global for access in tests
  (globalThis as any).__mockGetSessionStatus__ = mockGetSessionStatus;
  (globalThis as any).__mockEndSession__ = mockEndSession;
  
  return {
    sessionApi: {
      createSession: vi.fn(),
      getJoinToken: vi.fn(),
      startSession: vi.fn(),
      endSession: mockEndSession,
      emergencyTerminate: vi.fn(),
      getSessionStatus: mockGetSessionStatus,
    },
  };
});

describe('SessionDetailPage', () => {
  let mockSessionApi: any;
  
  beforeEach(async () => {
    vi.clearAllMocks();
    // Mock localStorage
    Storage.prototype.getItem = vi.fn((key: string) => {
      if (key === 'user_id') return 'test-user-123';
      return null;
    });
    
    // Get the mocked sessionApi
    const apiModule = await import('../../services/api');
    mockSessionApi = apiModule.sessionApi;
    
    // Reset to default mock response
    // Use mockResolvedValue so it persists across multiple calls
    (mockSessionApi.getSessionStatus as any).mockReset();
    (mockSessionApi.getSessionStatus as any).mockResolvedValue({
      status: 'started',
      participants: [
        { id: 'user-1', display_name: 'You', role: 'Mentorship Provider' },
        { id: 'user-2', display_name: 'Alex Chen', role: 'Patient' },
      ],
    });
    
    // Also reset endSession mock
    (mockSessionApi.endSession as any).mockReset();
    (mockSessionApi.endSession as any).mockResolvedValue({
      session_ended: true,
      end_timestamp: new Date().toISOString(),
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <SessionDetailPage />
      </BrowserRouter>
    );
  };

  it('should render loading state initially', () => {
    renderComponent();
    expect(screen.getByText(/Loading session details/i)).toBeInTheDocument();
  });

  it('should display session status after loading', async () => {
    // Clear mock to track calls
    const mockGetSessionStatus = (globalThis as any).__mockGetSessionStatus__;
    if (mockGetSessionStatus) {
      mockGetSessionStatus.mockClear();
    }
    (mockSessionApi.getSessionStatus as any).mockClear();
    
    renderComponent();
    
    // Wait for loading to complete and status to appear
    await waitFor(() => {
      expect(screen.getByText(/Session Status/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Check that API was called
    // Component calls loadSessionStatus() in useEffect which calls getSessionStatus(sessionId)
    await waitFor(() => {
      // Check both the direct mock and the sessionApi mock
      const calls = mockGetSessionStatus && mockGetSessionStatus.mock.calls.length > 0 
        ? mockGetSessionStatus.mock.calls 
        : (mockSessionApi.getSessionStatus as any).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('should display session status value', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/started/i)).toBeInTheDocument();
    });
  });

  it('should display participants list', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/Participants:/i)).toBeInTheDocument();
      expect(screen.getByText(/You/i)).toBeInTheDocument();
      expect(screen.getByText(/Alex Chen/i)).toBeInTheDocument();
    });
  });

  it('should show Start Session button when status is created', async () => {
    // Reset and set new mock response for 'created' status BEFORE rendering
    const mockGetSessionStatus = (globalThis as any).__mockGetSessionStatus__;
    if (mockGetSessionStatus) {
      mockGetSessionStatus.mockReset();
      mockGetSessionStatus.mockResolvedValue({
        status: 'created',
        participants: [],
      });
    }
    (mockSessionApi.getSessionStatus as any).mockReset();
    (mockSessionApi.getSessionStatus as any).mockResolvedValue({
      status: 'created',
      participants: [],
    });
    
    // Render component AFTER mock is set up
    renderComponent();
    
    // Wait for component to load and API call to complete
    await waitFor(() => {
      expect(screen.getByText(/Session Status/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Wait for status value "created" to appear - use exact text match
    // Status is displayed as: <span className="ml-2 text-lg font-semibold">{status?.status || 'Unknown'}</span>
    await waitFor(() => {
      // Try to find the exact text "created" (case-insensitive)
      const statusText = screen.getByText('created', { exact: false });
      expect(statusText).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Now check for Start Session button (only shown when status === 'created')
    // Button is conditionally rendered: {status?.status === 'created' && <Button>Start Session</Button>}
    await waitFor(() => {
      const startButton = screen.getByRole('button', { name: /Start Session/i });
      expect(startButton).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should show End Session button when status is started', async () => {
    // Reset and set mock BEFORE rendering
    const mockGetSessionStatus = (globalThis as any).__mockGetSessionStatus__;
    if (mockGetSessionStatus) {
      mockGetSessionStatus.mockReset();
      mockGetSessionStatus.mockResolvedValue({
        status: 'started',
        participants: [],
      });
    }
    (mockSessionApi.getSessionStatus as any).mockReset();
    (mockSessionApi.getSessionStatus as any).mockResolvedValue({
      status: 'started',
      participants: [],
    });
    
    renderComponent();
    
    await waitFor(() => {
      const endButton = screen.getByRole('button', { name: /End Session/i });
      expect(endButton).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should navigate to prestart page when Start Session is clicked', async () => {
    // Reset and set new mock response BEFORE rendering
    const mockGetSessionStatus = (globalThis as any).__mockGetSessionStatus__;
    if (mockGetSessionStatus) {
      mockGetSessionStatus.mockReset();
      mockGetSessionStatus.mockResolvedValue({
        status: 'created',
        participants: [],
      });
    }
    (mockSessionApi.getSessionStatus as any).mockReset();
    (mockSessionApi.getSessionStatus as any).mockResolvedValue({
      status: 'created',
      participants: [],
    });
    
    // Render component AFTER mock is set up
    renderComponent();
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(/Session Status/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Wait for status "created" to appear - use exact text match
    await waitFor(() => {
      const statusText = screen.getByText('created', { exact: false });
      expect(statusText).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Wait for Start Session button to appear
    await waitFor(() => {
      const startButton = screen.getByRole('button', { name: /Start Session/i });
      expect(startButton).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Click the button
    const startButton = screen.getByRole('button', { name: /Start Session/i });
    startButton.click();
    
    // Verify navigation - handleStartSession navigates to prestart page (line 38 of SessionDetailPage.tsx)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`/sessions/${mockSessionId}/prestart`);
    }, { timeout: 2000 });
  });

  it('should call endSession API when End Session is clicked', async () => {
    // Reset and set new mock response
    const mockGetSessionStatus = (globalThis as any).__mockGetSessionStatus__;
    const mockEndSession = (globalThis as any).__mockEndSession__;
    
    if (mockGetSessionStatus) {
      mockGetSessionStatus.mockReset();
      mockGetSessionStatus.mockResolvedValue({
        status: 'started',
        participants: [],
      });
    }
    (mockSessionApi.getSessionStatus as any).mockReset();
    (mockSessionApi.getSessionStatus as any).mockResolvedValue({
      status: 'started',
      participants: [],
    });
    
    // Clear endSession mock to track calls
    if (mockEndSession) {
      mockEndSession.mockClear();
    }
    (mockSessionApi.endSession as any).mockClear();
    
    renderComponent();
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(/Session Status/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Wait for status "started" to appear
    await waitFor(() => {
      const statusText = screen.getByText('started', { exact: false });
      expect(statusText).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Wait for End Session button to appear
    await waitFor(() => {
      const endButton = screen.getByRole('button', { name: /End Session/i });
      expect(endButton).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Click the button
    const endButton = screen.getByRole('button', { name: /End Session/i });
    endButton.click();
    
    // Wait for API call - endSession is called with 3 params: sessionId, endedBy, endReason
    // See handleEndSession in SessionDetailPage.tsx line 46
    await waitFor(() => {
      // Check both mocks - prefer the global mock if available
      const calls = mockEndSession && mockEndSession.mock.calls.length > 0 
        ? mockEndSession.mock.calls 
        : (mockSessionApi.endSession as any).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toBe(mockSessionId);
      expect(calls[0][1]).toBe('test-user-123');
      expect(calls[0][2]).toBe('normal_completion');
    }, { timeout: 3000 });
  });

  it('should display error message on API failure', async () => {
    const errorMessage = 'Failed to load session';
    // Reset and set error response
    const mockGetSessionStatus = (globalThis as any).__mockGetSessionStatus__;
    if (mockGetSessionStatus) {
      mockGetSessionStatus.mockReset();
      mockGetSessionStatus.mockRejectedValue({
        response: { data: { message: errorMessage } },
      });
    }
    (mockSessionApi.getSessionStatus as any).mockReset();
    (mockSessionApi.getSessionStatus as any).mockRejectedValue({
      response: { data: { message: errorMessage } },
    });
    
    renderComponent();
    
    // Wait for error to appear
    // Error is shown when error && !status (see line 61-68 in SessionDetailPage.tsx)
    // Error is displayed in: <p className="text-red-600 mb-4">{error}</p>
    await waitFor(() => {
      // The error message should be displayed
      const errorElement = screen.queryByText(errorMessage) ||
                          screen.queryByText((_content, element) => {
                            return element?.textContent?.includes(errorMessage) || false;
                          });
      expect(errorElement).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});

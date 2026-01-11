/**
 * Unit tests for useSessionStatus hook
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useSessionStatus } from '../useSessionStatus';
import { sessionApi } from '../../services/api';
import type { SessionStatusResponse } from '../../types/session';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock sessionApi
vi.mock('../../services/api', () => ({
  sessionApi: {
    getSessionStatus: vi.fn(),
  },
}));

// Mock timers
vi.useFakeTimers();

describe('useSessionStatus', () => {
  const mockSessionId = 'session-123';
  const mockStatusResponse: SessionStatusResponse = {
    session_id: mockSessionId,
    status: 'waiting',
    participants: [
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
    ],
    recording_status: 'inactive',
    transcription_status: 'inactive',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (sessionApi.getSessionStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockStatusResponse);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should fetch status initially when enabled', async () => {
    const { result } = renderHook(() =>
      useSessionStatus({
        sessionId: mockSessionId,
        enabled: true,
      })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(sessionApi.getSessionStatus).toHaveBeenCalledWith(mockSessionId);
    expect(result.current.status).toEqual(mockStatusResponse);
    expect(result.current.participants).toHaveLength(2);
    expect(result.current.readyCount).toBe(2);
  });

  it('should not fetch when disabled', () => {
    renderHook(() =>
      useSessionStatus({
        sessionId: mockSessionId,
        enabled: false,
      })
    );

    expect(sessionApi.getSessionStatus).not.toHaveBeenCalled();
  });

  it('should poll status at specified interval', async () => {
    const { result } = renderHook(() =>
      useSessionStatus({
        sessionId: mockSessionId,
        enabled: true,
        interval: 1000,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(sessionApi.getSessionStatus).toHaveBeenCalledTimes(1);

    // Fast-forward time
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(sessionApi.getSessionStatus).toHaveBeenCalledTimes(2);
    });
  });

  it('should stop polling when 2 participants are ready', async () => {
    const { result } = renderHook(() =>
      useSessionStatus({
        sessionId: mockSessionId,
        enabled: true,
        interval: 1000,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.readyCount).toBe(2);

    // Fast-forward time - polling should have stopped
    jest.advanceTimersByTime(2000);

    // Should still be called only once (initial call)
    expect(sessionApi.getSessionStatus).toHaveBeenCalledTimes(1);
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Failed to fetch status');
    (sessionApi.getSessionStatus as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() =>
      useSessionStatus({
        sessionId: mockSessionId,
        enabled: true,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.status).toBeNull();
  });

  it('should call onStatusUpdate callback when status updates', async () => {
    const onStatusUpdate = vi.fn();

    const { result } = renderHook(() =>
      useSessionStatus({
        sessionId: mockSessionId,
        enabled: true,
        onStatusUpdate,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(onStatusUpdate).toHaveBeenCalledWith(mockStatusResponse);
  });

  it('should refetch when refetch is called', async () => {
    const { result } = renderHook(() =>
      useSessionStatus({
        sessionId: mockSessionId,
        enabled: true,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = (sessionApi.getSessionStatus as ReturnType<typeof vi.fn>).mock.calls.length;

    await act(async () => {
      await result.current.refetch();
    });

    expect(sessionApi.getSessionStatus).toHaveBeenCalledTimes(initialCallCount + 1);
  });

  it('should cleanup interval on unmount', () => {
    const { unmount } = renderHook(() =>
      useSessionStatus({
        sessionId: mockSessionId,
        enabled: true,
        interval: 1000,
      })
    );

    unmount();

    // Fast-forward time - should not trigger more calls
    jest.advanceTimersByTime(2000);

    expect(sessionApi.getSessionStatus).toHaveBeenCalledTimes(1);
  });
});


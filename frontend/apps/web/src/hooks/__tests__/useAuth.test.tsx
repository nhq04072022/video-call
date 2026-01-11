/**
 * Unit tests for useAuth hook
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { useAuthStore } from '../../stores/authStore';
import type { User } from '../../types/user';

// Mock the authStore
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('useAuth', () => {
  const mockStore = {
    token: null as string | null,
    user: null as User | null,
    isAuthenticated: vi.fn(() => false),
    logout: vi.fn(),
    setToken: vi.fn(),
    setUser: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.token = null;
    mockStore.user = null;
    mockStore.isAuthenticated.mockReturnValue(false);

    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector(mockStore);
      }
      return selector;
    });
  });

  it('should return initial state when not authenticated', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should return token and user when authenticated', () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'mentor',
    };
    const mockToken = 'test-token-123';

    mockStore.token = mockToken;
    mockStore.user = mockUser;
    mockStore.isAuthenticated.mockReturnValue(true);

    const { result } = renderHook(() => useAuth());

    expect(result.current.token).toBe(mockToken);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should call setToken when setToken is invoked', () => {
    const { result } = renderHook(() => useAuth());
    const newToken = 'new-token-456';

    act(() => {
      result.current.setToken(newToken);
    });

    expect(mockStore.setToken).toHaveBeenCalledWith(newToken);
  });

  it('should call setUser when setUser is invoked', () => {
    const { result } = renderHook(() => useAuth());
    const newUser: User = {
      id: 'user-2',
      email: 'new@example.com',
      name: 'New User',
      role: 'patient',
    };

    act(() => {
      result.current.setUser(newUser);
    });

    expect(mockStore.setUser).toHaveBeenCalledWith(newUser);
  });

  it('should call logout when logout is invoked', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.logout();
    });

    expect(mockStore.logout).toHaveBeenCalled();
  });

  it('should update isAuthenticated when token is set', () => {
    mockStore.isAuthenticated.mockReturnValue(true);
    mockStore.token = 'token-123';

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(mockStore.isAuthenticated).toHaveBeenCalled();
  });
});


/**
 * Zustand store for authentication state management
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/user';

interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setToken: (token: string) => set({ token }),
      setUser: (user: User) => set({ user }),
      logout: () => {
        // Clear token and user
        set({ token: null, user: null });
        // Clear localStorage (persist middleware will handle this, but we can also manually clear)
        localStorage.removeItem('auth-storage');
      },
      isAuthenticated: () => {
        const state = get();
        return state.token !== null && state.user !== null;
      },
    }),
    {
      name: 'auth-storage', // localStorage key
    }
  )
);


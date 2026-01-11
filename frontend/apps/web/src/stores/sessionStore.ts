/**
 * Zustand store for session state management
 */
import { create } from 'zustand';
import type { SessionStatusResponse, SessionCreationResponse } from '../types/session';

interface SessionState {
  currentSession: SessionCreationResponse | null;
  sessionStatus: SessionStatusResponse | null;
  currentSessionId: string | null;
  setCurrentSession: (session: SessionCreationResponse) => void;
  setCurrentSessionId: (sessionId: string) => void;
  updateSessionStatus: (status: SessionStatusResponse) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,
  sessionStatus: null,
  currentSessionId: null,
  setCurrentSession: (session: SessionCreationResponse) => set({ currentSession: session, currentSessionId: session.session_id }),
  setCurrentSessionId: (sessionId: string) => set({ currentSessionId: sessionId }),
  updateSessionStatus: (status: SessionStatusResponse) => set({ sessionStatus: status }),
  clearSession: () => set({ currentSession: null, sessionStatus: null, currentSessionId: null }),
}));


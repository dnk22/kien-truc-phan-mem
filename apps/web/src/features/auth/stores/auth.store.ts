import { create } from 'zustand';
import type { UserProfile } from '../types';
interface AuthState {
  accessToken: string | null;
  user: UserProfile | null;
  restoring: boolean;
  revision: number;
  setSession: (accessToken: string, user: UserProfile) => void;
  clear: () => void;
  finishRestoring: () => void;
}
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  restoring: true,
  revision: 0,
  setSession: (accessToken, user) =>
    set((s) => ({ accessToken, user, revision: s.revision + 1 })),
  clear: () =>
    set((s) => ({
      accessToken: null,
      user: null,
      restoring: false,
      revision: s.revision + 1,
    })),
  finishRestoring: () => set({ restoring: false }),
}));

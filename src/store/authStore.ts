import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';

interface AuthStore {
  user: User | null;
  session: Session | null;
  accessToken: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      accessToken: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setAccessToken: (token) => set({ accessToken: token }),
      setLoading: (isLoading) => set({ isLoading }),
      clear: () => set({ user: null, session: null, accessToken: null }),
    }),
    { name: 'hireflow-auth', partialize: (s) => ({ accessToken: s.accessToken }) }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  // Substack session cookie
  substackCookie: string;

  // Actions
  setSubstackCookie: (cookie: string) => void;
  clearSubstackCookie: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      substackCookie: '',

      setSubstackCookie: (cookie) => {
        // Clean up the cookie value
        const cleaned = cookie.trim();
        set({ substackCookie: cleaned });
      },

      clearSubstackCookie: () => {
        set({ substackCookie: '' });
      },
    }),
    {
      name: 'speed-reader-auth',
    }
  )
);

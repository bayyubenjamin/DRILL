import { create } from 'zustand';

interface User {
  id: string;
  telegram_user_id: number;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthFailed: boolean;
  setUser: (user: User) => void;
  setAuthFailed: () => void;
  setGuest: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAuthFailed: false,
  setUser: (user) => set({ user, isAuthenticated: true, isLoading: false, isAuthFailed: false }),
  setAuthFailed: () => set({ isLoading: false, isAuthenticated: false, isAuthFailed: true }),
  setGuest: () => set({ user: null, isAuthenticated: false, isLoading: false, isAuthFailed: false }),
}));

import { create } from 'zustand';

interface User {
  id: string;
  telegram_user_id: number;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  setAuthFailed: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  setAuthFailed: () => set({ isLoading: false, isAuthenticated: false }),
}));

import { create } from 'zustand';

interface Preferences {
  theme: 'light' | 'dark';
  language: string;
}

interface UserState {
  id: string | null;
  name: string;
  avatarUrl?: string;
  email?: string;
  isLoggedIn: boolean;
  preferences: Preferences;
}

interface UserActions {
  setUser: (user: Partial<UserState>) => void;
  logout: () => void;
  updatePreferences: (prefs: Partial<Preferences>) => void;
}

export const useUserStore = create<UserState & UserActions>((set) => ({
  id: null,
  name: '',
  avatarUrl: undefined,
  email: undefined,
  isLoggedIn: false,
  preferences: {
    theme: 'light',
    language: 'en',
  },

  setUser: (user) =>
    set((state) => ({
      ...state,
      ...user,
      isLoggedIn: true,
    })),
  logout: () => set({ id: null, isLoggedIn: false }),
  updatePreferences: (prefs) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        ...prefs,
      },
    })),
}));
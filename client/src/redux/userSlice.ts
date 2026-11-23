import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  uid?: string;
  _id?: string;
  email: string | null;
  displayName?: string | null;
  name?: string;
  photoURL?: string | null;
  avatarIcon?: string | null;
  role?: 'student' | 'admin';
  college?: string;
  branch?: string;
  graduationYear?: number;
  credits?: number;
  streakCount?: number;
}

export interface UserState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isAuthModalOpen: boolean;
}

const getInitialUser = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem('careerflow_user');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse cached user:', err);
  }
  return null;
};

const initialCachedUser = getInitialUser();

const initialState: UserState = {
  user: initialCachedUser,
  isAuthenticated: !!initialCachedUser,
  isLoading: false,
  error: null,
  isAuthModalOpen: false,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      state.isAuthModalOpen = false;
      try {
        localStorage.setItem('careerflow_user', JSON.stringify(action.payload));
      } catch (err) {
        console.warn('Failed to cache user to localStorage:', err);
      }
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      try {
        localStorage.removeItem('careerflow_user');
      } catch (err) {
        console.warn('Failed to clear user from localStorage:', err);
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    openAuthModal: (state) => {
      state.isAuthModalOpen = true;
      state.error = null;
    },
    closeAuthModal: (state) => {
      state.isAuthModalOpen = false;
      state.error = null;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        try {
          localStorage.setItem('careerflow_user', JSON.stringify(state.user));
        } catch (err) {
          console.warn('Failed to update cached user:', err);
        }
      }
    },
  },
});

export const {
  setUser,
  clearUser,
  setLoading,
  setError,
  openAuthModal,
  closeAuthModal,
  updateUserProfile,
} = userSlice.actions;

export default userSlice.reducer;

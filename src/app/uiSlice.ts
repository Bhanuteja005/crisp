import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  activeTab: 'interviewee' | 'interviewer';
  showWelcomeModal: boolean;
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
}

const initialState: UIState = {
  activeTab: 'interviewee',
  showWelcomeModal: false,
  isLoading: false,
  error: null,
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<'interviewee' | 'interviewer'>) => {
      state.activeTab = action.payload;
    },
    setShowWelcomeModal: (state, action: PayloadAction<boolean>) => {
      state.showWelcomeModal = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setActiveTab,
  setShowWelcomeModal,
  setLoading,
  setError,
  setTheme,
  clearError,
} = uiSlice.actions;

export default uiSlice.reducer;
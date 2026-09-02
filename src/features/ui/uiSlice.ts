import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'int-client.themeMode';

/** Reads the persisted choice, falling back to the OS preference on first visit. */
const initialThemeMode = (): ThemeMode => {
  const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

interface UiState {
  themeMode: ThemeMode;
}

const initialState: UiState = { themeMode: initialThemeMode() };

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    themeModeChanged(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
      globalThis.localStorage?.setItem(STORAGE_KEY, action.payload);
    },
    themeModeToggled(state) {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
      globalThis.localStorage?.setItem(STORAGE_KEY, state.themeMode);
    },
  },
  selectors: {
    selectThemeMode: (state: UiState) => state.themeMode,
  },
});

export const { themeModeChanged, themeModeToggled } = uiSlice.actions;
export const { selectThemeMode } = uiSlice.selectors;

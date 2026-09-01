import { createTheme, type Theme } from '@mui/material/styles'
import type { ThemeMode } from './features/ui/uiSlice'

/** Single source of truth for the MUI theme, rebuilt when the colour mode changes. */
export const buildTheme = (mode: ThemeMode): Theme =>
  createTheme({
    palette: {
      mode,
      primary: { main: mode === 'light' ? '#1b5e9c' : '#7db1e0' },
      background:
        mode === 'light' ? { default: '#f5f7fa', paper: '#ffffff' } : { default: '#12161c' },
    },
    shape: { borderRadius: 10 },
    typography: {
      h1: { fontSize: '1.75rem', fontWeight: 600 },
      h2: { fontSize: '1.25rem', fontWeight: 600 },
    },
    components: {
      MuiCard: { defaultProps: { variant: 'outlined' } },
      MuiTableCell: { styleOverrides: { head: { fontWeight: 600 } } },
    },
  })

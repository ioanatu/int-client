import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { useMemo } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAppSelector } from './app/hooks'
import { Layout } from './components/Layout'
import { NotFoundPage } from './components/NotFoundPage'
import { SupplierDetailPage } from './features/suppliers/SupplierDetailPage'
import { SupplierListPage } from './features/suppliers/SupplierListPage'
import { selectThemeMode } from './features/ui/uiSlice'
import { buildTheme } from './theme'

export const App = () => {
  const themeMode = useAppSelector(selectThemeMode)
  const theme = useMemo(() => buildTheme(themeMode), [themeMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/suppliers" replace />} />
          <Route path="suppliers" element={<SupplierListPage />} />
          <Route path="suppliers/:supplierId" element={<SupplierDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
  )
}

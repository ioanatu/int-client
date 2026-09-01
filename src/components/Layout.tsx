import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import AppBar from '@mui/material/AppBar'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, Outlet } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { selectThemeMode, themeModeToggled } from '../features/ui/uiSlice'

export const Layout = () => {
  const dispatch = useAppDispatch()
  const themeMode = useAppSelector(selectThemeMode)
  const nextMode = themeMode === 'light' ? 'dark' : 'light'

  return (
    <>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/suppliers"
            sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}
          >
            IntNext
          </Typography>
          <Tooltip title={`Switch to ${nextMode} mode`}>
            <IconButton
              color="inherit"
              onClick={() => dispatch(themeModeToggled())}
              aria-label={`Switch to ${nextMode} mode`}
            >
              {themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </>
  )
}

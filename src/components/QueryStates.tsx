import RefreshIcon from '@mui/icons-material/Refresh';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

/** Centred spinner used while a query has no data to show yet. */
export const LoadingState = ({ label = 'Loading…' }: { label?: string }) => (
  <Box
    component="output"
    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 8 }}
    aria-live="polite"
  >
    <CircularProgress aria-hidden />
    <Typography color="text.secondary">{label}</Typography>
  </Box>
);

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState = ({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) => (
  <Alert
    severity="error"
    sx={{ my: 3 }}
    action={
      onRetry ? (
        <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
          Retry
        </Button>
      ) : undefined
    }
  >
    <AlertTitle>{title}</AlertTitle>
    {message}
  </Alert>
);

export const EmptyState = ({ message }: { message: string }) => (
  <Box sx={{ py: 8, textAlign: 'center' }}>
    <Typography color="text.secondary">{message}</Typography>
  </Box>
);

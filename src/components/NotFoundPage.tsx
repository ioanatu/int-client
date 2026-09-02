import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';

export const NotFoundPage = () => (
  <Box sx={{ py: 8, textAlign: 'center' }}>
    <Typography variant="h1" gutterBottom>
      Page not found
    </Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>
      The page you are looking for does not exist.
    </Typography>
    <Button component={RouterLink} to="/suppliers" variant="contained">
      Go to suppliers
    </Button>
  </Box>
);

import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: '#0f172a',
        backgroundImage:
          'radial-gradient(circle at 18% 12%, rgba(215,180,106,0.24), transparent 28%), radial-gradient(circle at 82% 18%, rgba(139,92,246,0.22), transparent 28%), linear-gradient(180deg, #111827 0%, #0f172a 100%)',
      }}
    >
      <Container maxWidth="xs" sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}

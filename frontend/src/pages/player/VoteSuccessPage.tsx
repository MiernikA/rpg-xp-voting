import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Box, Container, Paper, Stack, Typography } from '@mui/material';

export function VoteSuccessPage() {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 5 } }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 3, sm: 4 },
          textAlign: 'center',
          background:
            'linear-gradient(135deg, rgba(215,180,106,0.18), rgba(139,92,246,0.10)), rgba(255,255,255,0.95)',
        }}
      >
        <Stack spacing={2} alignItems="center" textAlign="center">
          <CheckCircleIcon sx={{ fontSize: 72, color: '#d7b46a', filter: 'drop-shadow(0 8px 18px rgba(215,180,106,0.28))' }} />
          <Box>
            <Typography variant="h2">Votes submitted</Typography>
            <Typography color="text.secondary">
              Your distribution is locked for this session.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

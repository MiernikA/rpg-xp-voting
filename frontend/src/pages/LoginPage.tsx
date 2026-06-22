import LockIcon from '@mui/icons-material/Lock';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const tokenPair = await login({ username, password });
      navigate(tokenPair.user.role === 'admin' ? '/admin' : '/vote');
    } catch {
      setError('Invalid username or password.');
    }
  }

  return (
    <Paper
      component="form"
      onSubmit={submit}
      variant="outlined"
      sx={{
        width: '100%',
        p: { xs: 3, sm: 3.5 },
        bgcolor: 'rgba(255,255,255,0.96)',
        boxShadow: '0 24px 60px rgba(2,6,23,0.28)',
      }}
    >
      <Stack spacing={2.5}>
        <Box>
          <LockIcon color="primary" sx={{ fontSize: 34, mb: 1 }} />
          <Typography variant="h1">RPG XP Voting</Typography>
          <Typography color="text.secondary">Sign in to vote or manage the next session.</Typography>
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Username" value={username} onChange={(event) => setUsername(event.target.value)} required />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button type="submit" variant="contained" size="large">
          Sign in
        </Button>
      </Stack>
    </Paper>
  );
}

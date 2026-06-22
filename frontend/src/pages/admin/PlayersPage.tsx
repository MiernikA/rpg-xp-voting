import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyIcon from '@mui/icons-material/Key';
import SaveIcon from '@mui/icons-material/Save';
import { Alert, Avatar, Box, Button, Card, CardContent, Chip, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';

import { endpoints } from '../../api/endpoints';
import { LoadingState } from '../../shared/ui/LoadingState';
import type { PlayerCreate, Role } from '../../types/api';
import { getApiErrorMessage } from '../../shared/api/apiError';

const initialForm: PlayerCreate = {
  username: '',
  display_name: '',
  password: '',
  role: 'player',
};

interface AccountEditForm {
  username: string;
  displayName: string;
  password: string;
}

export function PlayersPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PlayerCreate>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdMessage, setCreatedMessage] = useState<string | null>(null);
  const [accountForms, setAccountForms] = useState<Record<number, AccountEditForm>>({});
  const { data = [], isLoading } = useQuery({ queryKey: ['players'], queryFn: endpoints.players });
  const createMutation = useMutation({
    mutationFn: endpoints.createPlayer,
    onSuccess: (player) => {
      setForm(initialForm);
      setFormError(null);
      setCreatedMessage(`${player.display_name} was created.`);
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
    onError: (error) => {
      setCreatedMessage(null);
      setFormError(getApiErrorMessage(error, 'Could not create player.'));
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => endpoints.updatePlayer(id, { is_active }),
    onSuccess: () => {
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
    onError: (error) => setFormError(getApiErrorMessage(error, 'Could not update player.')),
  });
  const accountMutation = useMutation({
    mutationFn: ({ id, username, displayName }: { id: number; username: string; displayName: string }) =>
      endpoints.updatePlayer(id, { username, display_name: displayName }),
    onSuccess: (player) => {
      setFormError(null);
      setCreatedMessage(`${player.display_name} was updated.`);
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      setCreatedMessage(null);
      setFormError(getApiErrorMessage(error, 'Could not update account details.'));
    },
  });
  const passwordMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      endpoints.resetPlayerPassword(id, password),
    onSuccess: (_, variables) => {
      setFormError(null);
      setCreatedMessage('Password updated.');
      setAccountForms((current) => ({
        ...current,
        [variables.id]: {
          ...current[variables.id],
          password: '',
        },
      }));
    },
    onError: (error) => {
      setCreatedMessage(null);
      setFormError(getApiErrorMessage(error, 'Could not reset password.'));
    },
  });
  const removeMutation = useMutation({
    mutationFn: endpoints.removePlayer,
    onSuccess: () => {
      setFormError(null);
      setCreatedMessage('Player removed.');
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      setCreatedMessage(null);
      setFormError(getApiErrorMessage(error, 'Could not remove player.'));
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const payload: PlayerCreate = {
      username: form.username.trim(),
      display_name: form.display_name.trim(),
      password: form.password,
      role: form.role,
    };

    if (!payload.username || !payload.display_name) {
      setFormError('Username and display name are required.');
      return;
    }
    setFormError(null);
    setCreatedMessage(null);
    createMutation.mutate(payload);
  }

  if (isLoading) return <LoadingState />;

  const activePlayers = data.filter((player) => player.role === 'player' && player.is_active);
  const inactivePlayers = data.filter((player) => player.role === 'player' && !player.is_active);
  const admins = data.filter((player) => player.role === 'admin');
  const accountFormFor = (playerId: number) => {
    const player = data.find((item) => item.id === playerId);
    return (
      accountForms[playerId] ??
      (player
        ? { username: player.username, displayName: player.display_name, password: '' }
        : { username: '', displayName: '', password: '' })
    );
  };
  const setAccountForm = (playerId: number, values: Partial<AccountEditForm>) => {
    const current = accountFormFor(playerId);
    setAccountForms((forms) => ({
      ...forms,
      [playerId]: { ...current, ...values },
    }));
  };

  return (
    <Stack spacing={2.5} alignItems="center">
      <Stack spacing={0.75} sx={{ width: '100%', maxWidth: 1280, textAlign: 'center' }}>
        <Typography variant="h2">Players</Typography>
        <Typography color="text.secondary">
          Create accounts, control access, and keep the voting roster ready for group sessions.
        </Typography>
      </Stack>

      <Box sx={{ width: '100%', maxWidth: 1280 }}>
        {formError && <Alert severity="error">{formError}</Alert>}
        {createdMessage && <Alert severity="success">{createdMessage}</Alert>}
      </Box>

      <Grid
        container
        spacing={2}
        sx={{
          width: '100%',
          maxWidth: 1280,
          alignItems: 'stretch',
          '& > .MuiGrid-item': { display: 'flex' },
          '& > .MuiGrid-item > .MuiCard-root': { width: '100%' },
        }}
        justifyContent="center"
      >
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
              <Stack spacing={1.5}>
                <Typography variant="h3">Account Rules</Typography>
                <Typography color="text.secondary">
                  Players can vote and appear in group rosters. Admins can manage players, groups, sessions, and results.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`${activePlayers.length} active players`} color="success" sx={{ fontWeight: 800 }} />
                  <Chip label={`${inactivePlayers.length} inactive`} sx={{ fontWeight: 800 }} />
                  <Chip label={`${admins.length} admins`} color="primary" sx={{ fontWeight: 800 }} />
                </Stack>
                <Box sx={{ border: '1px solid #edf0f5', borderRadius: 1, p: 1.5 }}>
                  <Typography fontWeight={900}>Access control</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Deactivated players cannot participate in new active workflows but remain available for history.
                  </Typography>
                </Box>
                <Box sx={{ border: '1px solid #edf0f5', borderRadius: 1, p: 1.5 }}>
                  <Typography fontWeight={900}>Removal guard</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Remove is only shown for inactive player accounts and still respects backend history checks.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card component="form" onSubmit={submit} variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', p: { xs: 2.25, md: 3 }, '&:last-child': { pb: { xs: 2.25, md: 3 } } }}>
              <Stack spacing={2} sx={{ height: '100%' }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={1}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="h3">Create Account</Typography>
                    <Typography color="text.secondary">
                      Add a player for voting or an admin for management access.
                    </Typography>
                  </Stack>
                  <Chip label={form.role === 'admin' ? 'Admin access' : 'Player account'} color={form.role === 'admin' ? 'primary' : 'success'} sx={{ height: 30, fontWeight: 800 }} />
                </Stack>
                <Grid container spacing={1.5} sx={{ flex: 1, alignItems: 'stretch' }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Username"
                      value={form.username}
                      onChange={(event) => setForm({ ...form, username: event.target.value })}
                      required
                      fullWidth
                      helperText="Used for login. Must be unique."
                      sx={{ height: '100%' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Display name"
                      value={form.display_name}
                      onChange={(event) => setForm({ ...form, display_name: event.target.value })}
                      required
                      fullWidth
                      helperText="Shown on votes, results, and groups."
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Password"
                      type="password"
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      required
                      fullWidth
                      helperText="Give this to the new account owner."
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label="Role"
                      value={form.role}
                      onChange={(event) => setForm({ ...form, role: event.target.value as Role })}
                      fullWidth
                      helperText="Admins can manage the app."
                    >
                      <MenuItem value="player">Player</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
                <Box sx={{ pt: 0.5 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<AddIcon />}
                    disabled={createMutation.isPending}
                    fullWidth
                    size="large"
                    sx={{ minHeight: 48 }}
                  >
                    {createMutation.isPending ? 'Adding' : 'Add account'}
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={1.5} sx={{ width: '100%', maxWidth: 1280 }}>
        {data.map((player) => (
          <Grid item xs={12} key={player.id}>
            <Card variant="outlined">
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', lg: 'center' }}>
                  <Avatar
                    src={player.avatar_url ?? undefined}
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: player.profile_color,
                      fontWeight: 900,
                      border: '2px solid #ffffff',
                      boxShadow: '0 10px 20px rgba(17,24,39,0.12)',
                    }}
                  >
                    {player.display_name.charAt(0)}
                  </Avatar>
                  <Stack sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="h3" noWrap>{player.display_name}</Typography>
                      <Chip
                        label={player.role}
                        color={player.role === 'admin' ? 'primary' : 'default'}
                        size="small"
                        sx={{ height: 22, fontWeight: 800, fontSize: 12 }}
                      />
                      <Chip
                        icon={player.is_active ? <CheckCircleIcon /> : <BlockIcon />}
                        label={player.is_active ? 'active' : 'inactive'}
                        color={player.is_active ? 'success' : 'error'}
                        size="small"
                        sx={{ height: 22, fontWeight: 800, fontSize: 12, '& .MuiChip-icon': { fontSize: 15 } }}
                      />
                    </Stack>
                    <Typography color="text.secondary" noWrap>
                      @{player.username}
                    </Typography>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button
                      variant="outlined"
                      onClick={() => updateMutation.mutate({ id: player.id, is_active: !player.is_active })}
                    >
                      {player.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    {!player.is_active && player.role === 'player' && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        disabled={removeMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Remove ${player.display_name}? This only works for players without voting history.`)) {
                            removeMutation.mutate(player.id);
                          }
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </Stack>
                  </Stack>
                  <Grid container spacing={1.25}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Username"
                        value={accountFormFor(player.id).username}
                        onChange={(event) => setAccountForm(player.id, { username: event.target.value })}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Display name"
                        value={accountFormFor(player.id).displayName}
                        onChange={(event) => setAccountForm(player.id, { displayName: event.target.value })}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={accountMutation.isPending}
                        fullWidth
                        sx={{ minHeight: 40 }}
                        onClick={() => {
                          const accountForm = accountFormFor(player.id);
                          const username = accountForm.username.trim();
                          const displayName = accountForm.displayName.trim();
                          if (!username || !displayName) {
                            setFormError('Username and display name are required.');
                            return;
                          }
                          setCreatedMessage(null);
                          accountMutation.mutate({ id: player.id, username, displayName });
                        }}
                      >
                        Save account
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <TextField
                        label="New password"
                        type="password"
                        value={accountFormFor(player.id).password}
                        onChange={(event) => setAccountForm(player.id, { password: event.target.value })}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        variant="outlined"
                        startIcon={<KeyIcon />}
                        disabled={!accountFormFor(player.id).password || passwordMutation.isPending}
                        fullWidth
                        sx={{ minHeight: 40 }}
                        onClick={() => {
                          const password = accountFormFor(player.id).password;
                          setCreatedMessage(null);
                          passwordMutation.mutate({ id: player.id, password });
                        }}
                      >
                        Change password
                      </Button>
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

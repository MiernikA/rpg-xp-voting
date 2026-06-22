import AddIcon from '@mui/icons-material/Add';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';

import { endpoints } from '../../api/endpoints';
import { LoadingState } from '../../shared/ui/LoadingState';
import type { GroupCreate } from '../../types/api';
import { getApiErrorMessage } from '../../shared/api/apiError';

const initialGroupForm: GroupCreate = { name: '', description: '', member_ids: [] };

export function CreateGroupPage() {
  const queryClient = useQueryClient();
  const [groupForm, setGroupForm] = useState<GroupCreate>(initialGroupForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: endpoints.players,
  });

  const activePlayers = players.filter((player) => player.role === 'player' && player.is_active);

  const createGroupMutation = useMutation({
    mutationFn: endpoints.createGroup,
    onSuccess: () => {
      setGroupForm(initialGroupForm);
      setError(null);
      setMessage('Group created.');
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Could not create group.')),
  });

  function toggleMember(playerId: number) {
    setGroupForm((current) => ({
      ...current,
      member_ids: current.member_ids.includes(playerId)
        ? current.member_ids.filter((id) => id !== playerId)
        : [...current.member_ids, playerId],
    }));
  }

  function submitGroup(event: FormEvent) {
    event.preventDefault();
    if (!groupForm.name.trim()) {
      setError('Group name is required.');
      return;
    }
    createGroupMutation.mutate({ ...groupForm, name: groupForm.name.trim() });
  }

  if (isLoading) return <LoadingState />;

  return (
    <Stack spacing={2.5} alignItems="center">
      <Stack spacing={0.75} sx={{ width: '100%', maxWidth: 920, textAlign: 'center' }}>
        <Typography variant="h2">Create Group</Typography>
        <Typography color="text.secondary">
          Groups keep sessions, votes, results, and statistics scoped to the same party.
        </Typography>
      </Stack>

      <Grid container spacing={2} sx={{ width: '100%', maxWidth: 920 }} justifyContent="center">
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
              <Stack spacing={1.5}>
                <Typography variant="h3">How It Works</Typography>
                <Typography color="text.secondary">
                  Add active players now so future voting sessions can inherit the right participant list.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`${activePlayers.length} active players`} color="primary" sx={{ fontWeight: 800 }} />
                  <Chip label={`${groupForm.member_ids.length} selected`} color="success" sx={{ fontWeight: 800 }} />
                </Stack>
                <Box sx={{ border: '1px solid #edf0f5', borderRadius: 1, p: 1.5 }}>
                  <Typography fontWeight={900}>Session scope</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Each group has its own sessions, status, published results, and stats dashboard.
                  </Typography>
                </Box>
                <Box sx={{ border: '1px solid #edf0f5', borderRadius: 1, p: 1.5 }}>
                  <Typography fontWeight={900}>Member control</Typography>
                  <Typography color="text.secondary" variant="body2">
                    You can edit group membership later from Manage Groups.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card component="form" onSubmit={submitGroup} variant="outlined" sx={{ mx: 'auto' }}>
            <CardContent sx={{ p: { xs: 2.25, md: 3 }, '&:last-child': { pb: { xs: 2.25, md: 3 } } }}>
              <Stack spacing={2}>
                <Stack spacing={0.5}>
                  <Typography variant="h3">Group Details</Typography>
                  <Typography color="text.secondary">
                    Name the party, add context for admins, then choose the starting roster.
                  </Typography>
                </Stack>
                <TextField
                  label="Group name"
                  value={groupForm.name}
                  onChange={(event) => setGroupForm({ ...groupForm, name: event.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Description"
                  value={groupForm.description}
                  onChange={(event) => setGroupForm({ ...groupForm, description: event.target.value })}
                  multiline
                  minRows={2}
                  fullWidth
                />
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                    <Typography variant="h3">Members</Typography>
                    <Chip label={`${groupForm.member_ids.length} selected`} sx={{ height: 30, fontWeight: 800 }} />
                  </Stack>
                  <Stack spacing={0.75} sx={{ maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
                    {activePlayers.length === 0 && (
                      <Typography color="text.secondary">No active players available.</Typography>
                    )}
                    {activePlayers.map((player) => {
                      const selected = groupForm.member_ids.includes(player.id);
                      return (
                        <Box
                          key={player.id}
                          onClick={() => toggleMember(player.id)}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'auto minmax(0, 1fr) auto',
                            alignItems: 'center',
                            gap: 1.25,
                            p: 1.25,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: selected ? 'primary.main' : '#edf0f5',
                            bgcolor: selected ? 'rgba(24,92,80,0.07)' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'border-color 160ms ease, background-color 160ms ease',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: 'rgba(24,92,80,0.05)',
                            },
                          }}
                        >
                          <Avatar
                            src={player.avatar_url ?? undefined}
                            sx={{
                              width: 42,
                              height: 42,
                              bgcolor: player.profile_color,
                              fontWeight: 900,
                            }}
                          >
                            {player.display_name.charAt(0)}
                          </Avatar>
                          <Stack sx={{ minWidth: 0 }}>
                            <Typography fontWeight={900} noWrap>
                              {player.display_name}
                            </Typography>
                            <Typography color="text.secondary" variant="body2" noWrap>
                              @{player.username}
                            </Typography>
                          </Stack>
                          <Checkbox
                            checked={selected}
                            onChange={() => toggleMember(player.id)}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </Stack>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={createGroupMutation.isPending}
                  size="large"
                >
                  Create group
                </Button>
                {error && <Alert severity="error">{error}</Alert>}
                {message && <Alert severity="success">{message}</Alert>}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

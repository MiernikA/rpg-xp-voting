import AddIcon from '@mui/icons-material/Add';
import ArchiveIcon from '@mui/icons-material/Archive';
import CampaignIcon from '@mui/icons-material/Campaign';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { Alert, Button, Card, CardContent, Checkbox, FormControlLabel, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useMemo, useState } from 'react';

import { endpoints } from '../../api/endpoints';
import { LoadingState } from '../../shared/ui/LoadingState';
import type { VotingSessionCreate } from '../../types/api';
import { getApiErrorMessage } from '../../shared/api/apiError';

type SessionForm = Omit<VotingSessionCreate, 'group_id'> & { group_id: number | '' };

const initialForm: SessionForm = {
  title: '',
  description: '',
  group_id: '',
  participant_ids: [],
  points_pool: 10,
};

export function SessionsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SessionForm>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const { data = [], isLoading } = useQuery({ queryKey: ['sessions'], queryFn: () => endpoints.sessions() });
  const progressQueries = useQueries({
    queries: data.map((session) => ({
      queryKey: ['session-progress', session.id],
      queryFn: () => endpoints.progress(session.id),
      enabled: session.status !== 'draft',
    })),
  });
  const progressBySession = new Map(
    progressQueries.map((query, index) => [data[index]?.id, query.data]),
  );
  const { data: groups = [], isLoading: groupsLoading } = useQuery({ queryKey: ['groups'], queryFn: endpoints.groups });
  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === form.group_id),
    [groups, form.group_id],
  );
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
    queryClient.invalidateQueries({ queryKey: ['session-progress'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const createMutation = useMutation({
    mutationFn: endpoints.createSession,
    onSuccess: () => {
      setForm(initialForm);
      setError(null);
      refresh();
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Session operation failed.')),
  });
  const activateMutation = useMutation({
    mutationFn: endpoints.activateSession,
    onSuccess: refresh,
    onError: (err) => setError(getApiErrorMessage(err, 'Session operation failed.')),
  });
  const closeMutation = useMutation({
    mutationFn: endpoints.closeSession,
    onSuccess: refresh,
    onError: (err) => setError(getApiErrorMessage(err, 'Session operation failed.')),
  });
  const publishMutation = useMutation({
    mutationFn: endpoints.publishResults,
    onSuccess: refresh,
    onError: (err) => setError(getApiErrorMessage(err, 'Could not publish results.')),
  });
  const archiveMutation = useMutation({
    mutationFn: endpoints.archiveResults,
    onSuccess: refresh,
    onError: (err) => setError(getApiErrorMessage(err, 'Could not archive results.')),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.group_id) {
      setError('Pick a group for this voting session.');
      return;
    }
    if (form.participant_ids.length < 2) {
      setError('Pick at least 2 participants.');
      return;
    }
    if (form.points_pool % 5 !== 0) {
      setError('Pool must be a multiple of 5.');
      return;
    }
    createMutation.mutate({ ...form, group_id: form.group_id });
  }

  function toggleParticipant(playerId: number) {
    setForm((current) => ({
      ...current,
      participant_ids: current.participant_ids.includes(playerId)
        ? current.participant_ids.filter((id) => id !== playerId)
        : [...current.participant_ids, playerId],
    }));
  }

  if (isLoading || groupsLoading) return <LoadingState />;

  return (
    <Stack spacing={3.5}>
      <Stack spacing={0.75}>
        <Typography variant="h2">Voting Sessions</Typography>
        <Typography color="text.secondary">Create drafts, pick participants, and manage session status.</Typography>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      <Card component="form" onSubmit={submit} variant="outlined">
        <CardContent>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={4}>
              <TextField label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required fullWidth />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Group"
                value={form.group_id}
                onChange={(event) => {
                  const groupId = Number(event.target.value);
                  const group = groups.find((item) => item.id === groupId);
                  setForm({
                    ...form,
                    group_id: groupId,
                    participant_ids: group?.members.map((member) => member.id) ?? [],
                  });
                }}
                required
                fullWidth
              >
                {groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                label="XP Pool"
                type="number"
                value={form.points_pool}
                onChange={(event) => setForm({ ...form, points_pool: Number(event.target.value) })}
                inputProps={{ min: 5, step: 5, inputMode: 'numeric' }}
                helperText="Must be a multiple of 5. Votes are XP 1:1."
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} multiline minRows={2} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                Participants
              </Typography>
              {!selectedGroup && <Alert severity="info">Pick a group to choose players.</Alert>}
              <Grid container spacing={1.25}>
                {selectedGroup?.members.map((player) => (
                  <Grid item xs={12} sm={6} md={4} key={player.id}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.participant_ids.includes(player.id)}
                          onChange={() => toggleParticipant(player.id)}
                        />
                      }
                      label={player.display_name}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating' : 'Create draft'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Grid container spacing={2.5}>
        {data.map((session) => {
          const progress = progressBySession.get(session.id);
          const submittedVotes = progress?.submitted_votes ?? 0;
          const totalPlayers = progress?.total_players ?? session.participant_ids.length;
          const allVoted = totalPlayers > 0 && submittedVotes >= totalPlayers;
          return (
          <Grid item xs={12} md={6} key={session.id}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Stack>
                    <Typography variant="h3">{session.title}</Typography>
                    <Typography color="text.secondary">
                      {session.status} - {session.points_pool} XP - authors shown
                    </Typography>
                    <Typography color="text.secondary">
                      {session.group_name ?? 'No group'} - {session.participant_ids.length} participants
                    </Typography>
                    <Typography color="text.secondary">
                      Voted: {submittedVotes} / {totalPlayers}
                    </Typography>
                    {session.results_published && (
                      <Typography fontWeight={800} color="primary.main">
                        {session.results_archived ? 'Results archived' : 'Results published'}
                      </Typography>
                    )}
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {session.status === 'draft' && (
                      <Button
                        variant="contained"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => activateMutation.mutate(session.id)}
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<StopIcon />}
                      disabled={session.status !== 'active'}
                      onClick={() => closeMutation.mutate(session.id)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<CampaignIcon />}
                      disabled={!allVoted || session.results_published || publishMutation.isPending}
                      onClick={() => publishMutation.mutate(session.id)}
                    >
                      Publish results
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ArchiveIcon />}
                      disabled={!session.results_published || session.results_archived || archiveMutation.isPending}
                      onClick={() => archiveMutation.mutate(session.id)}
                    >
                      Archive session
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}

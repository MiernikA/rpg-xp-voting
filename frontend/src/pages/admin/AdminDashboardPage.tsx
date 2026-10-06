import { useRef, useState } from 'react';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DownloadIcon from '@mui/icons-material/Download';
import RestoreIcon from '@mui/icons-material/Restore';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '../../api/endpoints';
import { LoadingState } from '../../shared/ui/LoadingState';
import { MetricCard } from '../../shared/ui/MetricCard';
import { getApiErrorMessage } from '../../shared/api/apiError';

export function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeConfirmation, setPurgeConfirmation] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string | null>(null);
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);
  const { data, isLoading: dashboardLoading } = useQuery({ queryKey: ['dashboard'], queryFn: endpoints.dashboard });
  const { data: groups = [], isLoading: groupsLoading } = useQuery({ queryKey: ['groups'], queryFn: endpoints.groups });
  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: endpoints.players,
  });
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => endpoints.sessions(),
  });
  const invalidateDashboardData = async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['groups'] });
    await queryClient.invalidateQueries({ queryKey: ['players'] });
    await queryClient.invalidateQueries({ queryKey: ['sessions'] });
  };
  const downloadBackup = async () => {
    const blob = await endpoints.backupCsv();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  const backupMutation = useMutation({
    mutationFn: downloadBackup,
    onSuccess: () => {
      setMaintenanceError(null);
      setMaintenanceMessage('Backup CSV downloaded. No system data was changed.');
    },
    onError: (error) => {
      setMaintenanceMessage(null);
      setMaintenanceError(getApiErrorMessage(error, 'Backup CSV could not be downloaded.'));
    },
  });
  const purgeMutation = useMutation({
    mutationFn: async () => {
      await downloadBackup();
      await endpoints.purgeSystem(purgeConfirmation);
    },
    onSuccess: async () => {
      setPurgeOpen(false);
      setPurgeConfirmation('');
      setMaintenanceError(null);
      setMaintenanceMessage('Backup downloaded and system data removed. Only your Game Master account remains.');
      await invalidateDashboardData();
    },
    onError: (error) => {
      setMaintenanceMessage(null);
      setMaintenanceError(getApiErrorMessage(error, 'System data could not be removed.'));
    },
  });
  const restoreMutation = useMutation({
    mutationFn: async (file: File) => endpoints.restoreBackup(file),
    onSuccess: async () => {
      setRestoreFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setMaintenanceError(null);
      setMaintenanceMessage('Backup CSV imported and the system was restored to that file.');
      await invalidateDashboardData();
    },
    onError: (error) => {
      setMaintenanceMessage(null);
      setMaintenanceError(getApiErrorMessage(error, 'Backup CSV could not be imported.'));
    },
  });

  if (dashboardLoading || groupsLoading || playersLoading || sessionsLoading) return <LoadingState />;

  const activePlayers = players.filter((player) => player.role === 'player' && player.is_active);
  const closedSessions = sessions.filter((session) => session.status === 'closed');
  const publishedSessions = sessions.filter((session) => session.results_published && !session.results_archived);
  const archivedSessions = sessions.filter((session) => session.results_archived);
  const activeCompletion =
    data?.active_session_id && data.total_players > 0
      ? Math.round((data.submitted_votes / data.total_players) * 100)
      : 0;
  const historicalSessions = [...closedSessions].sort(
    (left, right) =>
      new Date(right.closed_at ?? right.created_at).getTime()
      - new Date(left.closed_at ?? left.created_at).getTime(),
  );
  const totalXpPool = sessions.reduce((sum, session) => sum + session.points_pool, 0);

  return (
    <Stack
      spacing={2}
      sx={{
        '& .MuiGrid-item': {
          display: 'flex',
        },
        '& .MuiGrid-item > .MuiCard-root': {
          width: '100%',
        },
        '& .MuiCardContent-root': {
          width: '100%',
        },
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={1.5}
        sx={{ px: 0.625 }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h2">Dashboard</Typography>
          <Typography color="text.secondary">Session archive and long-term campaign overview.</Typography>
        </Stack>
        <Stack
          direction="row"
          spacing={0.75}
          flexWrap="wrap"
          useFlexGap
          alignItems="center"
          justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
          sx={{ minHeight: 42 }}
        >
          <Chip label={`${sessions.length} sessions`} color="primary" sx={{ height: 34, fontWeight: 800, fontSize: 14 }} />
          <Chip label={`${groups.length} groups`} sx={{ height: 34, fontWeight: 800, fontSize: 14 }} />
          <Chip label={`${activePlayers.length} active players`} color="success" sx={{ height: 34, fontWeight: 800, fontSize: 14 }} />
        </Stack>
      </Stack>

      <Grid container spacing={1.25}>
        <Grid item xs={6} md={2.4}>
          <MetricCard label="Completed" value={closedSessions.length} helper={`${sessions.length} total sessions`} />
        </Grid>
        <Grid item xs={6} md={2.4}>
          <MetricCard label="Archived" value={archivedSessions.length} helper="stored results" />
        </Grid>
        <Grid item xs={6} md={2.4}>
          <MetricCard label="Published" value={publishedSessions.length} helper="visible results" />
        </Grid>
        <Grid item xs={6} md={2.4}>
          <MetricCard label="Historical XP" value={totalXpPool} helper="all session pools" />
        </Grid>
        <Grid item xs={6} md={2.4}>
          <MetricCard label="Vote Lines" value={data?.total_votes ?? 0} helper="historical votes" />
        </Grid>
      </Grid>

      <Dialog open={purgeOpen} onClose={() => setPurgeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Remove all system data</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            <Alert severity="warning">
              This downloads a backup CSV first, then removes users, groups, sessions, votes, and results. Only the Game Master account you are using stays in the system.
            </Alert>
            <TextField
              label='Type "I want to remove"'
              value={purgeConfirmation}
              onChange={(event) => setPurgeConfirmation(event.target.value)}
              fullWidth
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurgeOpen(false)} disabled={purgeMutation.isPending}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => purgeMutation.mutate()}
            disabled={purgeConfirmation !== 'I want to remove' || purgeMutation.isPending}
          >
            Download backup and remove
          </Button>
        </DialogActions>
      </Dialog>

      <Card variant="outlined">
        <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Stack sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h3">Active Session</Typography>
              <Typography color="text.secondary" noWrap>
                {data?.active_session_title ?? 'No active session is running'}
              </Typography>
            </Stack>
            {data?.active_session_id ? (
              <>
                <Box sx={{ flex: { md: '0 1 360px' }, minWidth: { md: 260 } }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={800}>
                      {activeCompletion}% complete
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {data.submitted_votes} voted · {data.pending_players} pending
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={activeCompletion} sx={{ height: 8, borderRadius: 999 }} />
                </Box>
                <Chip label="Active" color="success" sx={{ fontWeight: 800, alignSelf: { xs: 'flex-start', md: 'center' } }} />
              </>
            ) : (
              <Chip label="Idle" sx={{ fontWeight: 800, alignSelf: { xs: 'flex-start', md: 'center' } }} />
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 1.75, md: 2.25 }, '&:last-child': { pb: { xs: 1.75, md: 2.25 } } }}>
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1}
            >
              <Stack spacing={0.25}>
                <Typography variant="h3">Session Archive</Typography>
                <Typography color="text.secondary" variant="body2">
                  Completed sessions, publication state, participants, and historical XP pools.
                </Typography>
              </Stack>
              <Chip label={`${historicalSessions.length} completed`} color="primary" sx={{ fontWeight: 800 }} />
            </Stack>

            {historicalSessions.length === 0 && (
              <Box sx={{ py: 4, textAlign: 'center', border: '1px dashed #d0d5dd', borderRadius: 1 }}>
                <Typography color="text.secondary">No completed sessions yet.</Typography>
              </Box>
            )}

            <Stack spacing={0.75} sx={{ maxHeight: 720, overflowY: 'auto', pr: historicalSessions.length > 6 ? 0.5 : 0 }}>
              {historicalSessions.map((session) => {
                const closedAt = session.closed_at ? new Date(session.closed_at) : null;
                const resultLabel = session.results_archived
                  ? 'Archived'
                  : session.results_published
                    ? 'Published'
                    : 'Not published';
                const resultColor = session.results_archived
                  ? 'default'
                  : session.results_published
                    ? 'primary'
                    : 'warning';

                return (
                  <Box
                    key={session.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1.5fr) repeat(3, minmax(110px, auto))' },
                      gap: { xs: 1, md: 2 },
                      alignItems: 'center',
                      px: { xs: 1.25, md: 1.75 },
                      py: 1.25,
                      border: '1px solid #e6e8ef',
                      borderRadius: 1,
                      bgcolor: session.results_archived ? '#f8fafc' : '#ffffff',
                    }}
                  >
                    <Stack sx={{ minWidth: 0 }}>
                      <Typography fontWeight={900} noWrap>
                        {session.title}
                      </Typography>
                      <Typography color="text.secondary" variant="body2" noWrap>
                        {session.group_name ?? 'No group'}
                      </Typography>
                    </Stack>
                    <Stack>
                      <Typography color="text.secondary" variant="caption" fontWeight={800}>
                        CLOSED
                      </Typography>
                      <Typography variant="body2" fontWeight={800}>
                        {closedAt ? closedAt.toLocaleDateString() : 'Unknown date'}
                      </Typography>
                    </Stack>
                    <Stack>
                      <Typography color="text.secondary" variant="caption" fontWeight={800}>
                        SESSION
                      </Typography>
                      <Typography variant="body2" fontWeight={800}>
                        {session.participant_ids.length} players · {session.points_pool} XP
                      </Typography>
                    </Stack>
                    <Chip label={resultLabel} color={resultColor} size="small" sx={{ fontWeight: 800, justifySelf: { md: 'end' } }} />
                  </Box>
                );
              })}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={1.25}>
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
              <Stack spacing={1.25}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={1.25}>
                  <Stack spacing={0.25}>
                    <Typography variant="h3">System Maintenance</Typography>
                    <Typography color="text.secondary" variant="body2">
                      Backup, restore, or clear the full game data set.
                    </Typography>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      hidden
                      onChange={(event) => setRestoreFile(event.target.files?.[0] ?? null)}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<RestoreIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={backupMutation.isPending || restoreMutation.isPending || purgeMutation.isPending}
                    >
                      Choose backup CSV
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => backupMutation.mutate()}
                      disabled={backupMutation.isPending || restoreMutation.isPending || purgeMutation.isPending}
                    >
                      Download backup CSV
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<RestoreIcon />}
                      onClick={() => restoreFile && restoreMutation.mutate(restoreFile)}
                      disabled={!restoreFile || backupMutation.isPending || restoreMutation.isPending || purgeMutation.isPending}
                    >
                      Restore backup
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<DeleteForeverIcon />}
                      onClick={() => {
                        setMaintenanceError(null);
                        setMaintenanceMessage(null);
                        setPurgeOpen(true);
                      }}
                      disabled={backupMutation.isPending || restoreMutation.isPending || purgeMutation.isPending}
                    >
                      Remove all data
                    </Button>
                  </Stack>
                </Stack>
                {restoreFile && (
                  <Typography color="text.secondary" variant="body2">
                    Selected file: {restoreFile.name}
                  </Typography>
                )}
                {maintenanceMessage && <Alert severity="success">{maintenanceMessage}</Alert>}
                {maintenanceError && <Alert severity="error">{maintenanceError}</Alert>}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

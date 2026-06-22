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
import { D3Chart } from '../../shared/ui/D3Chart';
import { LoadingState } from '../../shared/ui/LoadingState';
import { MetricCard } from '../../shared/ui/MetricCard';
import { getApiErrorMessage } from '../../shared/api/apiError';

function InlineStat({ label, value }: { label: string; value: string | number }) {
  return (
    <Box sx={{ height: '100%', minHeight: 74, border: '1px solid #edf0f5', borderRadius: 1, px: 1.25, py: 1 }}>
      <Typography color="text.secondary" variant="body2" fontWeight={700}>
        {label}
      </Typography>
      <Typography variant="h3">{value}</Typography>
    </Box>
  );
}

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
  const inactivePlayers = players.filter((player) => player.role === 'player' && !player.is_active);
  const draftSessions = sessions.filter((session) => session.status === 'draft');
  const activeSessions = sessions.filter((session) => session.status === 'active');
  const closedSessions = sessions.filter((session) => session.status === 'closed');
  const publishedSessions = sessions.filter((session) => session.results_published && !session.results_archived);
  const archivedSessions = sessions.filter((session) => session.results_archived);
  const totalExpectedVotes = activeSessions.reduce((sum, session) => sum + session.participant_ids.length, 0);
  const activeCompletion =
    data?.active_session_id && data.total_players > 0
      ? Math.round((data.submitted_votes / data.total_players) * 100)
      : 0;
  const totalMembersInGroups = groups.reduce((sum, group) => sum + group.members.length, 0);
  const averageGroupSize = groups.length ? Math.round((totalMembersInGroups / groups.length) * 10) / 10 : 0;
  const recentSessions = [...sessions]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 6);
  const largestGroups = [...groups]
    .sort((left, right) => right.members.length - left.members.length)
    .slice(0, 5);
  const maxGroupSize = Math.max(...groups.map((group) => group.members.length), 1);
  const totalXpPool = sessions.reduce((sum, session) => sum + session.points_pool, 0);
  const averageXpPool = sessions.length ? Math.round(totalXpPool / sessions.length) : 0;

  const sessionStatusData = [
    { label: 'Draft', value: draftSessions.length },
    { label: 'Active', value: activeSessions.length },
    { label: 'Closed', value: closedSessions.length },
  ].filter((item) => item.value > 0);
  const publishingData = [
    { label: 'Published', value: publishedSessions.length },
    { label: 'Archived', value: archivedSessions.length },
    { label: 'Hidden', value: sessions.filter((session) => !session.results_published).length },
  ].filter((item) => item.value > 0);
  const playerStatusData = [
    { label: 'ActivePlayer', value: activePlayers.length },
    { label: 'Inactive', value: inactivePlayers.length },
  ].filter((item) => item.value > 0);
  const groupBars = largestGroups.map((group) => ({
    label: group.name.length > 10 ? `${group.name.slice(0, 10)}...` : group.name,
    value: group.members.length,
  }));

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
          <Typography color="text.secondary">Current voting activity and platform health.</Typography>
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
        <Grid item xs={12} md={3}>
          <MetricCard label="Active Session" value={data?.active_session_title ?? 'None'} />
        </Grid>
        <Grid item xs={6} sm={4} md={1.5}>
          <MetricCard label="Voted" value={data?.submitted_votes ?? 0} />
        </Grid>
        <Grid item xs={6} sm={4} md={1.5}>
          <MetricCard label="Pending" value={data?.pending_players ?? 0} />
        </Grid>
        <Grid item xs={6} sm={4} md={1.5}>
          <MetricCard label="Vote Lines" value={data?.total_votes ?? 0} />
        </Grid>
        <Grid item xs={6} sm={4} md={1.5}>
          <MetricCard label="Groups" value={groups.length} helper={`${averageGroupSize} avg`} />
        </Grid>
        <Grid item xs={6} sm={4} md={1.5}>
          <MetricCard label="Published" value={publishedSessions.length} helper={`${archivedSessions.length} archived`} />
        </Grid>
        <Grid item xs={6} sm={4} md={1.5}>
          <MetricCard label="Avg XP" value={averageXpPool} helper="per session" />
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

      <Grid container spacing={1.25}>
        <Grid item xs={12} lg={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', p: 1.75, '&:last-child': { pb: 1.75 } }}>
              <Stack spacing={1.25} sx={{ height: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                  <Stack sx={{ minWidth: 0 }}>
                    <Typography variant="h3">Active Voting</Typography>
                    <Typography color="text.secondary" noWrap>
                      {data?.active_session_title ?? 'No active session'}
                    </Typography>
                  </Stack>
                  <Typography variant="h2">{activeCompletion}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={activeCompletion} sx={{ height: 10, borderRadius: 999 }} />
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 0.75,
                    alignItems: 'stretch',
                  }}
                >
                  <InlineStat label="Expected" value={totalExpectedVotes} />
                  <InlineStat label="Done" value={data?.submitted_votes ?? 0} />
                  <InlineStat label="Pending" value={data?.pending_players ?? 0} />
                </Box>
                <Box sx={{ flex: 1, minHeight: 0, display: 'grid', placeItems: 'center', border: '1px dashed #edf0f5', borderRadius: 1, px: 1.5 }}>
                  <Typography color="text.secondary" variant="body2" textAlign="center">
                    {activeSessions.length > 0 ? 'Waiting for players to submit votes.' : 'No active session is running.'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={2.5}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', p: 1.75, '&:last-child': { pb: 1.75 } }}>
              <Stack spacing={1} sx={{ height: '100%', justifyContent: 'space-between' }}>
                <Typography variant="h3">Sessions</Typography>
                {sessionStatusData.length > 0 ? <D3Chart data={sessionStatusData} type="donut" height={150} compact /> : <Typography color="text.secondary">No sessions.</Typography>}
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  <Chip label={`${draftSessions.length} draft`} sx={{ height: 28, fontWeight: 800 }} />
                  <Chip label={`${activeSessions.length} active`} color="success" sx={{ height: 28, fontWeight: 800 }} />
                  <Chip label={`${closedSessions.length} closed`} color="warning" sx={{ height: 28, fontWeight: 800 }} />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={2.5}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', p: 1.75, '&:last-child': { pb: 1.75 } }}>
              <Stack spacing={1} sx={{ height: '100%', justifyContent: 'space-between' }}>
                <Typography variant="h3">Results</Typography>
                {publishingData.length > 0 ? <D3Chart data={publishingData} type="donut" height={150} compact /> : <Typography color="text.secondary">No results.</Typography>}
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  <Chip label={`${publishedSessions.length} live`} color="primary" sx={{ height: 28, fontWeight: 800 }} />
                  <Chip label={`${archivedSessions.length} archived`} sx={{ height: 28, fontWeight: 800 }} />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={3}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', p: 1.75, '&:last-child': { pb: 1.75 } }}>
              <Stack spacing={1.25} sx={{ height: '100%' }}>
                <Typography variant="h3">Group Load</Typography>
                {groupBars.length > 0 ? <D3Chart data={groupBars} type="bar" height={150} compact /> : <Typography color="text.secondary">No groups.</Typography>}
                {largestGroups.slice(0, 3).map((group) => (
                  <Stack key={group.id} spacing={0.5}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Typography variant="body2" fontWeight={800} noWrap>
                        {group.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {group.members.length}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={(group.members.length / maxGroupSize) * 100}
                      sx={{ height: 6, borderRadius: 999 }}
                    />
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={1.25}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', p: 1.75, '&:last-child': { pb: 1.75 } }}>
              <Stack spacing={1.25} sx={{ height: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Typography variant="h3">Players</Typography>
                  <Chip label={`${players.length} accounts`} sx={{ height: 28, fontWeight: 800 }} />
                </Stack>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'minmax(120px, 0.9fr) minmax(0, 1fr)' },
                    alignItems: 'center',
                    gap: 1.25,
                    flex: 1,
                  }}
                >
                  <Box sx={{ minHeight: 136 }}>
                    {playerStatusData.length > 0 ? (
                      <D3Chart data={playerStatusData} type="donut" height={136} compact />
                    ) : (
                      <Typography color="text.secondary">No players.</Typography>
                    )}
                  </Box>
                  <Stack spacing={0.75}>
                    <InlineStat label="Active" value={activePlayers.length} />
                    <InlineStat label="Inactive" value={inactivePlayers.length} />
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', p: 1.75, '&:last-child': { pb: 1.75 } }}>
              <Stack spacing={1.25} sx={{ height: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Typography variant="h3">Recent Sessions</Typography>
                  <Chip label={`${totalXpPool} total XP pool`} sx={{ height: 30, fontWeight: 800, flex: '0 0 auto' }} />
                </Stack>
                {recentSessions.length === 0 && <Typography color="text.secondary">No sessions yet.</Typography>}
                <Grid container spacing={0.75}>
                  {recentSessions.map((session) => (
                    <Grid item xs={12} sm={6} key={session.id}>
                      <Box sx={{ width: '100%', minHeight: 58, border: '1px solid #edf0f5', borderRadius: 1, p: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                          <Stack sx={{ minWidth: 0 }}>
                            <Typography fontWeight={900} noWrap>
                              {session.title}
                            </Typography>
                            <Typography color="text.secondary" variant="body2" noWrap>
                              {session.group_name ?? 'No group'} - {session.points_pool} XP
                            </Typography>
                          </Stack>
                          <Chip label={session.status} sx={{ height: 28, fontWeight: 800 }} />
                        </Stack>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

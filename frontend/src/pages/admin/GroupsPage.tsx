import AddIcon from '@mui/icons-material/Add';
import ArchiveIcon from '@mui/icons-material/Archive';
import CampaignIcon from '@mui/icons-material/Campaign';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import StopIcon from '@mui/icons-material/Stop';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import BarChartIcon from '@mui/icons-material/BarChart';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { endpoints } from '../../api/endpoints';
import { D3Chart } from '../../shared/ui/D3Chart';
import { LoadingState } from '../../shared/ui/LoadingState';
import { MetricCard } from '../../shared/ui/MetricCard';
import type { ChartPoint, Group, Player, ResultRow, VotingSessionCreate } from '../../types/api';
import { getApiErrorMessage } from '../../shared/api/apiError';

type GroupWorkspacePage = 'edit' | 'sessions' | 'stats';

const PAGE_MAX_WIDTH = 1280;
const GROUP_WORKSPACE_PAGES: GroupWorkspacePage[] = ['edit', 'sessions', 'stats'];

function parseUrlId(value: string | null) {
  if (!value) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isGroupWorkspacePage(value: string | null): value is GroupWorkspacePage {
  return Boolean(value && GROUP_WORKSPACE_PAGES.includes(value as GroupWorkspacePage));
}

function GroupChartCard({
  title,
  data,
  type,
}: {
  title: string;
  data: ChartPoint[];
  type: 'bar' | 'line' | 'pie';
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', p: 2, '&:last-child': { pb: 2 } }}>
        <Stack spacing={2}>
          <Typography variant="h3">{title}</Typography>
          {data.length === 0 ? (
            <Typography color="text.secondary">No data yet.</Typography>
          ) : (
            <D3Chart data={data} type={type === 'pie' ? 'donut' : type} height={240} />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function GroupsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { groupId: routeGroupId, tab: routeWorkspacePage } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [groupToManage, setGroupToManage] = useState<Group | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState(() => new Date().toISOString().slice(0, 10));
  const [pointsPool, setPointsPool] = useState(10);
  const [sessionParticipantIds, setSessionParticipantIds] = useState<number[]>([]);
  const [draftMemberIds, setDraftMemberIds] = useState<number[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupImageUrl, setGroupImageUrl] = useState('');
  const [showGmUsernames, setShowGmUsernames] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const workspacePageParam = routeWorkspacePage ?? searchParams.get('tab');
  const managedGroupId = parseUrlId(routeGroupId ?? searchParams.get('group'));
  const workspacePage: GroupWorkspacePage = isGroupWorkspacePage(workspacePageParam) ? workspacePageParam : 'edit';
  const selectedGmSessionId = parseUrlId(searchParams.get('gmSession'));
  const selectedGmPlayerId = parseUrlId(searchParams.get('gmPlayer'));

  const updateUrlState = (updates: Record<string, string | number | null>) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          next.delete(key);
          return;
        }
        next.set(key, String(value));
      });
      return next;
    });
  };
  const openGroupWorkspace = (groupId: number, tab: GroupWorkspacePage = 'edit') => {
    navigate(`/admin/groups/manage/${groupId}/${tab}`);
  };
  const openWorkspacePage = (tab: GroupWorkspacePage) => {
    if (!managedGroupId) return;
    navigate(`/admin/groups/manage/${managedGroupId}/${tab}`);
  };
  const closeGroupWorkspace = () => {
    navigate('/admin/groups/manage');
  };

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: endpoints.groups,
  });
  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: endpoints.players,
  });

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === managedGroupId) ?? null,
    [groups, managedGroupId],
  );
  const groupId = selectedGroup?.id;
  const activePlayers = players.filter((player) => player.role === 'player' && player.is_active);
  const memberIds = useMemo(
    () => selectedGroup?.members.map((member) => member.id) ?? [],
    [selectedGroup?.members],
  );
  const eligibleSessionMembers = useMemo(
    () => selectedGroup?.members.filter((member) => member.role === 'player' && member.is_active) ?? [],
    [selectedGroup?.members],
  );
  const eligibleSessionMemberIds = useMemo(
    () => eligibleSessionMembers.map((member) => member.id),
    [eligibleSessionMembers],
  );

  useEffect(() => {
    setDraftMemberIds(memberIds);
  }, [memberIds]);

  useEffect(() => {
    setSessionParticipantIds(eligibleSessionMemberIds);
  }, [eligibleSessionMemberIds]);

  useEffect(() => {
    setGroupName(selectedGroup?.name ?? '');
    setGroupImageUrl(selectedGroup?.image_url ?? '');
  }, [selectedGroup?.id, selectedGroup?.name, selectedGroup?.image_url]);

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions', groupId],
    queryFn: () => endpoints.sessions({ group_id: groupId }),
    enabled: Boolean(groupId),
  });
  const progressQueries = useQueries({
    queries: sessions.map((session) => ({
      queryKey: ['session-progress', session.id],
      queryFn: () => endpoints.progress(session.id),
      enabled: session.status !== 'draft',
    })),
  });
  const progressBySession = new Map(progressQueries.map((query, index) => [sessions[index]?.id, query.data]));
  const selectedSession = sessions.find((session) => session.status === 'closed');
  const gmSession = sessions.find((session) => session.id === selectedGmSessionId) ?? selectedSession;
  const { data: results = [] } = useQuery({
    queryKey: ['results', selectedSession?.id],
    queryFn: () => endpoints.results(selectedSession!.id),
    enabled: Boolean(selectedSession?.id && selectedSession.status === 'closed'),
  });
  const { data: gmView } = useQuery({
    queryKey: ['gm-session-view', gmSession?.id],
    queryFn: () => endpoints.gmSessionView(gmSession!.id),
    enabled: Boolean(gmSession?.id && gmSession.status === 'closed'),
  });
  const gmPlayers = useMemo(() => {
    const playerNames = new Map<number, string>();
    selectedGroup?.members.forEach((member) => playerNames.set(member.id, member.display_name));
    gmView?.votes.forEach((vote) => {
      playerNames.set(vote.voter_id, vote.voter);
      playerNames.set(vote.recipient_id, vote.recipient);
    });
    return Array.from(playerNames.entries()).map(([id, name]) => ({ id, name }));
  }, [gmView?.votes, selectedGroup?.members]);
  const selectedGmPlayer = gmPlayers.find((player) => player.id === selectedGmPlayerId) ?? gmPlayers[0];
  const gmPlayerLabel = (playerId: number, displayName: string) =>
    showGmUsernames
      ? selectedGroup?.members.find((member) => member.id === playerId)?.username ?? displayName
      : displayName;
  const gmRankingCards = useMemo(() => {
    if (!gmView) return [];
    return gmPlayers
      .map((player) => {
        const member = selectedGroup?.members.find((item) => item.id === player.id);
        const incoming = gmView.votes.filter((vote) => vote.recipient_id === player.id);
        const outgoing = gmView.votes.filter((vote) => vote.voter_id === player.id);
        const xpReceived = incoming.reduce((sum, vote) => sum + vote.points, 0);
        const xpGiven = outgoing.reduce((sum, vote) => sum + vote.points, 0);
        const gmNotes = outgoing.filter((vote) => vote.gm_note.trim());
        return {
          id: player.id,
          name: player.name,
          avatar_url: member?.avatar_url ?? null,
          profile_color: member?.profile_color ?? '#185c50',
          incoming,
          outgoing,
          gmNotes,
          xpReceived,
          xpGiven,
        };
      })
      .sort((left, right) => right.xpReceived - left.xpReceived);
  }, [gmPlayers, gmView, selectedGroup?.members]);
  const gmPrivateNotes = useMemo(() => {
    if (!gmView) return [];
    const notesByPlayer = new Map<number, { playerId: number; player: string; notes: string[] }>();
    gmView.votes.forEach((vote) => {
      const note = vote.gm_note.trim();
      if (!note) return;
      const existing = notesByPlayer.get(vote.voter_id);
      if (existing) {
        if (!existing.notes.includes(note)) existing.notes.push(note);
        return;
      }
      notesByPlayer.set(vote.voter_id, { playerId: vote.voter_id, player: vote.voter, notes: [note] });
    });
    return Array.from(notesByPlayer.values()).sort((left, right) => left.player.localeCompare(right.player));
  }, [gmView]);
  const closedSessions = sessions.filter((session) => session.status === 'closed');
  const resultQueries = useQueries({
    queries: closedSessions.map((session) => ({
      queryKey: ['results', session.id],
      queryFn: () => endpoints.results(session.id),
      enabled: workspacePage === 'stats',
    })),
  });

  const participationData = (selectedGroup?.members ?? []).map((member) => ({
    label: member.display_name,
    value: closedSessions.length
      ? Math.round(
          (closedSessions.filter((session) => session.participant_ids.includes(member.id)).length
            / closedSessions.length)
            * 1000,
        ) / 10
      : 0,
  }));
  const xpPoolData = sessions.map((session) => ({
    label: session.title,
    value: session.points_pool,
  }));
  const allGroupResults = resultQueries.flatMap((query) => query.data ?? []);
  const playerXpTotals = (selectedGroup?.members ?? [])
    .map((member) => ({
      label: member.display_name,
      value: allGroupResults
        .filter((row: ResultRow) => row.player_id === member.id)
        .reduce((sum: number, row: ResultRow) => sum + row.xp_awarded, 0),
    }))
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value)
    .slice(0, 8);
  const latestResultDistribution = results.map((row) => ({
    label: row.player,
    value: row.xp_awarded,
  }));
  const activeSession = sessions.find((session) => session.status === 'active');
  const activeProgress = activeSession ? progressBySession.get(activeSession.id) : null;
  const activeCompletion = activeProgress?.completion_percentage ?? 0;
  const totalXpPool = sessions.reduce((sum, session) => sum + session.points_pool, 0);
  const draftMembersChanged =
    draftMemberIds.length !== memberIds.length ||
    draftMemberIds.some((id) => !memberIds.includes(id));
  const groupDetailsChanged = selectedGroup
    ? groupName !== selectedGroup.name ||
      groupImageUrl !== (selectedGroup.image_url ?? '')
    : false;

  const refreshGroup = () => {
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
    queryClient.invalidateQueries({ queryKey: ['session-progress'] });
    queryClient.invalidateQueries({ queryKey: ['results'] });
    queryClient.invalidateQueries({ queryKey: ['gm-session-view'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const updateMembersMutation = useMutation({
    mutationFn: ({ id, member_ids }: { id: number; member_ids: number[] }) =>
      endpoints.updateGroup(id, { member_ids }),
    onSuccess: () => {
      setError(null);
      setMessage('Group members updated.');
      refreshGroup();
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Could not update group.')),
  });
  const updateGroupDetailsMutation = useMutation({
    mutationFn: ({ id, name, image_url }: { id: number; name: string; image_url: string }) =>
      endpoints.updateGroup(id, {
        name,
        image_url: image_url || null,
      }),
    onSuccess: () => {
      setError(null);
      setMessage('Group details updated.');
      refreshGroup();
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Could not update group details.')),
  });
  const removeGroupMutation = useMutation({
    mutationFn: endpoints.removeGroup,
    onSuccess: () => {
      closeGroupWorkspace();
      setGroupToManage(null);
      setError(null);
      setMessage('Group removed.');
      refreshGroup();
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Could not remove group.')),
  });
  const createSessionMutation = useMutation({
    mutationFn: endpoints.createSession,
    onSuccess: () => {
      setSessionTitle('');
      setSessionDescription(new Date().toISOString().slice(0, 10));
      setSessionParticipantIds(eligibleSessionMemberIds);
      setError(null);
      setMessage('Session draft created for this group.');
      refreshGroup();
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Could not create session.')),
  });
  const activateMutation = useMutation({
    mutationFn: endpoints.activateSession,
    onSuccess: refreshGroup,
    onError: (err) => setError(getApiErrorMessage(err, 'Could not activate session.')),
  });
  const closeMutation = useMutation({
    mutationFn: endpoints.closeSession,
    onSuccess: refreshGroup,
    onError: (err) => setError(getApiErrorMessage(err, 'Could not close session.')),
  });
  const publishMutation = useMutation({
    mutationFn: endpoints.publishResults,
    onSuccess: refreshGroup,
    onError: (err) => setError(getApiErrorMessage(err, 'Could not publish results.')),
  });
  const archiveMutation = useMutation({
    mutationFn: endpoints.archiveResults,
    onSuccess: refreshGroup,
    onError: (err) => setError(getApiErrorMessage(err, 'Could not archive session.')),
  });
  const removeSessionMutation = useMutation({
    mutationFn: endpoints.removeSession,
    onSuccess: () => {
      updateUrlState({ gmSession: null, gmPlayer: null });
      setError(null);
      setMessage('Session removed. Its vote XP no longer counts.');
      refreshGroup();
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Could not remove session.')),
  });

  function submitSession(event: FormEvent) {
    event.preventDefault();
    if (!selectedGroup) {
      setError('Pick a group first.');
      return;
    }
    if (sessionParticipantIds.length < 2) {
      setError('Select at least 2 participants for the session.');
      return;
    }
    const payload: VotingSessionCreate = {
      title: sessionTitle.trim() || `${selectedGroup.name} session`,
      description: sessionDescription.trim() || undefined,
      group_id: selectedGroup.id,
      participant_ids: sessionParticipantIds,
      points_pool: pointsPool,
    };
    createSessionMutation.mutate(payload);
  }

  function toggleDraftMember(playerId: number) {
    setDraftMemberIds((current) =>
      current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId],
    );
  }

  function selectGroupImage(file: File | undefined) {
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('Choose a PNG or JPG image.');
      return;
    }
    if (file.size > 1_500_000) {
      setError('Group image must be under 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setGroupImageUrl(String(reader.result));
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  if (groupsLoading || playersLoading || sessionsLoading) return <LoadingState />;

  return (
    <Stack spacing={2.5} alignItems="center" sx={{ width: '100%' }}>
      {!selectedGroup && (
      <>
      <Stack spacing={0.75} sx={{ width: '100%', maxWidth: PAGE_MAX_WIDTH, textAlign: 'center' }}>
        <Typography variant="h2">Manage Groups</Typography>
        <Typography color="text.secondary">
          Pick one group first, then manage only its sessions, results, stats, and members.
        </Typography>
      </Stack>

      <Box sx={{ width: '100%', maxWidth: PAGE_MAX_WIDTH }}>
        {error && <Alert severity="error">{error}</Alert>}
        {message && <Alert severity="success">{message}</Alert>}
      </Box>

      <Box
        sx={{
          width: '100%',
          maxWidth: PAGE_MAX_WIDTH,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        <Box sx={{ display: 'flex', minWidth: 0 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
              <Stack spacing={1.5}>
                <Typography variant="h3">Group Workspace</Typography>
                <Typography color="text.secondary">
                  Open one group to keep member edits, sessions, publishing, results, and stats scoped to that party.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`${groups.length} groups`} color="primary" sx={{ fontWeight: 800 }} />
                  <Chip label={`${activePlayers.length} active players`} color="success" sx={{ fontWeight: 800 }} />
                </Stack>
                <Box sx={{ border: '1px solid #edf0f5', borderRadius: 1, p: 1.5 }}>
                  <Typography fontWeight={900}>Select once</Typography>
                  <Typography color="text.secondary" variant="body2">
                    The tabs below switch between membership, sessions, and stats for the selected group only.
                  </Typography>
                </Box>
                <Box sx={{ border: '1px solid #edf0f5', borderRadius: 1, p: 1.5 }}>
                  <Typography fontWeight={900}>Results stay scoped</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Published and archived results remain attached to the group sessions that created them.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ display: 'flex', minWidth: 0 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', p: { xs: 2.25, md: 3 }, '&:last-child': { pb: { xs: 2.25, md: 3 } } }}>
              <Stack spacing={2} sx={{ height: '100%' }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={1}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="h3">Open Group</Typography>
                    <Typography color="text.secondary">Search by group name and open its management workspace.</Typography>
                  </Stack>
                  <Chip
                    label={groupToManage ? `${groupToManage.members.length} members` : 'No group selected'}
                    color={groupToManage ? 'primary' : 'default'}
                    sx={{ height: 30, fontWeight: 800 }}
                  />
                </Stack>
                <Box sx={{ flex: 1 }}>
                  <Autocomplete
                    options={groups}
                    value={groupToManage}
                    getOptionLabel={(group: Group) => group.name}
                    onChange={(_, group) => setGroupToManage(group)}
                    renderOption={(props, group) => (
                      <Box component="li" {...props} sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
                        <Avatar src={group.image_url ?? undefined} sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                          {group.name.charAt(0)}
                        </Avatar>
                        <Stack sx={{ minWidth: 0 }}>
                          <Typography fontWeight={900} noWrap>{group.name}</Typography>
                          <Typography color="text.secondary" variant="body2" noWrap>
                            {group.members.length} members
                          </Typography>
                        </Stack>
                      </Box>
                    )}
                    renderInput={(params) => <TextField {...params} label="Search group" helperText="Choose a group before opening the workspace." />}
                  />
                  {groupToManage && (
                    <Box sx={{ mt: 1.5, border: '1px solid #edf0f5', borderRadius: 1, p: 1.5 }}>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar src={groupToManage.image_url ?? undefined} sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontWeight: 900 }}>
                          {groupToManage.name.charAt(0)}
                        </Avatar>
                        <Stack sx={{ minWidth: 0 }}>
                          <Typography fontWeight={900} noWrap>{groupToManage.name}</Typography>
                          <Typography color="text.secondary" variant="body2" noWrap>
                            {groupToManage.members.length} members ready for management
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  )}
                </Box>
                <Box>
                  <Button
                    variant="contained"
                    disabled={!groupToManage}
                    onClick={() => {
                      if (groupToManage) openGroupWorkspace(groupToManage.id);
                    }}
                    size="large"
                    fullWidth
                    sx={{ minHeight: 48 }}
                  >
                    Open workspace
                  </Button>
                  <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                    Select a group and open it to manage roster, sessions, publishing, and stats.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
      </>
      )}

      {selectedGroup && (
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3.5 }, borderColor: '#e6e8ef', width: '100%', maxWidth: PAGE_MAX_WIDTH }}>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
                <Avatar src={selectedGroup.image_url ?? undefined} sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontWeight: 900, fontSize: 26 }}>
                  {selectedGroup.name.charAt(0)}
                </Avatar>
                <Stack sx={{ minWidth: 0 }}>
                <Typography variant="h2" noWrap>{selectedGroup.name}</Typography>
                <Typography color="text.secondary">
                  Managed group workspace: sessions, results, stats, and members are scoped only to this group.
                </Typography>
                </Stack>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`${selectedGroup.members.length} members`} color="primary" sx={{ fontWeight: 800 }} />
                <Chip label={`${sessions.length} sessions`} sx={{ fontWeight: 800 }} />
                <Chip label={`${closedSessions.length} closed`} color="success" sx={{ fontWeight: 800 }} />
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                color="inherit"
                startIcon={<ArrowBackIcon />}
                onClick={closeGroupWorkspace}
                sx={{
                  bgcolor: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#e2e8f0',
                    boxShadow: 'none',
                  },
                }}
              >
                Back to groups
              </Button>
              {[
                { id: 'edit', label: 'Edit Group', icon: <EditIcon /> },
                { id: 'sessions', label: 'Sessions', icon: <CampaignIcon /> },
                { id: 'stats', label: 'Stats', icon: <BarChartIcon /> },
              ].map((item) => (
                <Button
                  key={item.id}
                  variant={workspacePage === item.id ? 'contained' : 'outlined'}
                  startIcon={item.icon}
                  onClick={() => openWorkspacePage(item.id as GroupWorkspacePage)}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>

            {workspacePage === 'edit' && (
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2.25}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                    <Stack>
                    <Typography variant="h3">Edit Group</Typography>
                    <Typography color="text.secondary">{selectedGroup.members.length} members</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label={`${draftMemberIds.length} selected`} color="success" sx={{ fontWeight: 800 }} />
                      {draftMembersChanged && <Chip label="Unsaved changes" color="warning" sx={{ fontWeight: 800 }} />}
                    </Stack>
                  </Stack>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '260px minmax(0, 1fr)' },
                      gap: 2,
                      alignItems: 'stretch',
                    }}
                  >
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent sx={{ height: '100%', p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ height: '100%' }}>
                          <Stack spacing={1.25} alignItems="center">
                            <Avatar
                              src={groupImageUrl || undefined}
                              sx={{
                                width: 112,
                                height: 112,
                                bgcolor: 'primary.main',
                                fontSize: 38,
                                fontWeight: 900,
                                border: '3px solid #ffffff',
                                boxShadow: '0 16px 30px rgba(17,24,39,0.15)',
                              }}
                            >
                              {(groupName || selectedGroup.name).charAt(0)}
                            </Avatar>
                            <Stack spacing={0.25} textAlign="center">
                              <Typography fontWeight={900}>{groupName || selectedGroup.name}</Typography>
                              <Typography color="text.secondary" variant="body2">
                                Group image
                              </Typography>
                            </Stack>
                          </Stack>
                          <Stack spacing={1} sx={{ width: '100%' }}>
                            <Button variant="outlined" component="label" fullWidth sx={{ minHeight: 40 }}>
                              Upload image
                              <input
                                hidden
                                type="file"
                                accept="image/png,image/jpeg"
                                onChange={(event) => selectGroupImage(event.target.files?.[0])}
                              />
                            </Button>
                            <Button variant="outlined" color="error" onClick={() => setGroupImageUrl('')} fullWidth sx={{ minHeight: 40 }}>
                              Remove image
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent sx={{ height: '100%', p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack spacing={1.5} sx={{ height: '100%' }}>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between"
                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                            spacing={1}
                          >
                            <Stack spacing={0.5}>
                              <Typography variant="h3">Group Details</Typography>
                              <Typography color="text.secondary">
                                Update the visible group name and image used in management views.
                              </Typography>
                            </Stack>
                            {groupDetailsChanged && <Chip label="Unsaved" color="warning" sx={{ fontWeight: 800 }} />}
                          </Stack>
                          <TextField
                            label="Group name"
                            value={groupName}
                            onChange={(event) => setGroupName(event.target.value)}
                            required
                            fullWidth
                          />
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 'auto' }}>
                            <Button
                              variant="contained"
                              startIcon={<SaveIcon />}
                              disabled={!groupDetailsChanged || !groupName.trim() || updateGroupDetailsMutation.isPending}
                              onClick={() =>
                                updateGroupDetailsMutation.mutate({
                                  id: selectedGroup.id,
                                  name: groupName.trim(),
                                  image_url: groupImageUrl,
                                })
                              }
                              sx={{ minHeight: 40 }}
                            >
                              Save group details
                            </Button>
                            <Button
                              variant="outlined"
                              disabled={!groupDetailsChanged || updateGroupDetailsMutation.isPending}
                              onClick={() => {
                                setGroupName(selectedGroup.name);
                                setGroupImageUrl(selectedGroup.image_url ?? '');
                              }}
                              sx={{ minHeight: 40 }}
                            >
                              Reset details
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteIcon />}
                              disabled={sessions.length > 0 || removeGroupMutation.isPending}
                              onClick={() => {
                                if (window.confirm(`Remove ${selectedGroup.name}? This cannot be undone.`)) {
                                  removeGroupMutation.mutate(selectedGroup.id);
                                }
                              }}
                              sx={{ minHeight: 40 }}
                            >
                              Remove group
                            </Button>
                          </Stack>
                          {sessions.length > 0 && (
                            <Typography color="text.secondary" variant="body2">
                              Groups with sessions cannot be removed because their voting history must stay intact.
                            </Typography>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>

                  <Stack spacing={0.75} sx={{ maxHeight: 340, overflowY: 'auto', pr: 0.5 }}>
                    {activePlayers.map((player) => {
                      const selected = draftMemberIds.includes(player.id);
                      return (
                        <Box
                          key={player.id}
                          onClick={() => toggleDraftMember(player.id)}
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
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: 'rgba(24,92,80,0.05)',
                            },
                          }}
                        >
                          <Avatar src={player.avatar_url ?? undefined} sx={{ width: 42, height: 42, bgcolor: player.profile_color, fontWeight: 900 }}>
                            {player.display_name.charAt(0)}
                          </Avatar>
                          <Stack sx={{ minWidth: 0 }}>
                            <Typography fontWeight={900} noWrap>{player.display_name}</Typography>
                            <Typography color="text.secondary" variant="body2" noWrap>@{player.username}</Typography>
                          </Stack>
                          <Checkbox
                            checked={selected}
                            onChange={() => toggleDraftMember(player.id)}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button
                      variant="contained"
                      disabled={!draftMembersChanged || updateMembersMutation.isPending}
                      onClick={() =>
                        updateMembersMutation.mutate({ id: selectedGroup.id, member_ids: draftMemberIds })
                      }
                    >
                      Save group changes
                    </Button>
                    <Button
                      variant="outlined"
                      disabled={!draftMembersChanged || updateMembersMutation.isPending}
                      onClick={() => setDraftMemberIds(memberIds)}
                    >
                      Reset changes
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            )}

            {workspacePage === 'sessions' && (
            <>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={6}>
                <Card component="form" onSubmit={submitSession} variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ height: '100%', p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack spacing={1.5} sx={{ height: '100%' }}>
                    <Typography variant="h3">Sessions</Typography>
                    <TextField label="Title" value={sessionTitle} onChange={(event) => setSessionTitle(event.target.value)} fullWidth />
                    <TextField
                      label="XP Pool"
                      type="number"
                      value={pointsPool}
                      onChange={(event) => setPointsPool(Number(event.target.value))}
                      inputProps={{ min: 5, step: 5, inputMode: 'numeric' }}
                      fullWidth
                    />
                    <TextField
                      label="Session date"
                      type="date"
                      value={sessionDescription}
                      onChange={(event) => setSessionDescription(event.target.value)}
                      InputLabelProps={{ shrink: true }}
                      required
                      fullWidth
                    />
                    <Autocomplete
                      multiple
                      options={eligibleSessionMembers}
                      value={eligibleSessionMembers.filter((member) => sessionParticipantIds.includes(member.id))}
                      getOptionLabel={(member: Player) => member.display_name}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      onChange={(_, members) => setSessionParticipantIds(members.map((member) => member.id))}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Session participants"
                          helperText={`${sessionParticipantIds.length} selected; choose at least 2. Unselected group members will not take part.`}
                        />
                      )}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<AddIcon />}
                      disabled={createSessionMutation.isPending || sessionParticipantIds.length < 2}
                    >
                      Create group session
                    </Button>
                  </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ height: '100%', p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack spacing={2}>
                    <Typography variant="h3">Recent Sessions</Typography>
                    {sessions.length === 0 && <Typography color="text.secondary">No sessions for this group yet.</Typography>}
                    <Stack
                      spacing={1.25}
                      sx={{
                        maxHeight: { xs: 560, md: 680 },
                        overflowY: 'auto',
                        pr: sessions.length > 2 ? 0.75 : 0,
                        scrollbarGutter: 'stable',
                      }}
                    >
                    {sessions.map((session) => {
                      const progress = progressBySession.get(session.id);
                      const submitted = progress?.submitted_votes ?? 0;
                      const total = progress?.total_players ?? session.participant_ids.length;
                      return (
                        <Card
                          key={session.id}
                          variant="outlined"
                          sx={
                            session.results_archived
                              ? {
                                  bgcolor: '#f1f5f9',
                                  borderColor: '#cbd5e1',
                                  boxShadow: 'none',
                                  filter: 'grayscale(1)',
                                  '& .MuiTypography-root': {
                                    color: 'text.secondary',
                                  },
                                  '& .MuiButton-root': {
                                    bgcolor: '#e2e8f0',
                                    borderColor: '#cbd5e1',
                                    color: '#64748b',
                                    boxShadow: 'none',
                                    '&:hover': {
                                      bgcolor: '#e2e8f0',
                                      borderColor: '#94a3b8',
                                      color: '#475569',
                                    },
                                    '&.Mui-disabled': {
                                      bgcolor: '#e2e8f0',
                                      borderColor: '#cbd5e1',
                                      color: '#94a3b8',
                                    },
                                  },
                                }
                              : undefined
                          }
                        >
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Stack spacing={1.5}>
                              <Stack>
                                <Stack>
                                  <Typography fontWeight={900}>{session.title}</Typography>
                                  {session.description && (
                                    <Typography color="text.secondary" variant="body2">
                                      {session.description}
                                    </Typography>
                                  )}
                                  <Typography color="text.secondary">
                                    {session.status} - voted {submitted} / {total} - {session.points_pool} XP
                                  </Typography>
                                  {(session.results_published || session.results_archived) && (
                                    <Typography fontWeight={800} color="primary.main">
                                      {session.results_archived ? 'Archived' : 'Published'}
                                    </Typography>
                                  )}
                                </Stack>
                              </Stack>
                              <Stack
                                direction="row"
                                spacing={0.75}
                                useFlexGap
                                sx={{
                                  flexWrap: { xs: 'wrap', lg: 'nowrap' },
                                  alignItems: 'center',
                                  '& .MuiButton-root': {
                                    minWidth: 0,
                                    flex: { xs: '1 1 132px', lg: '1 1 0' },
                                    px: 1.2,
                                    whiteSpace: 'nowrap',
                                  },
                                  '& .MuiButton-startIcon': {
                                    mr: 0.6,
                                  },
                                }}
                              >
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
                                  disabled={submitted === 0 || session.results_published || publishMutation.isPending}
                                  onClick={() => publishMutation.mutate(session.id)}
                                >
                                  Publish
                                </Button>
                                <Button
                                  variant="outlined"
                                  startIcon={<ArchiveIcon />}
                                  disabled={session.status !== 'closed' || session.results_archived || archiveMutation.isPending}
                                  onClick={() => archiveMutation.mutate(session.id)}
                                >
                                  {session.results_archived ? 'Archived' : 'Archive'}
                                </Button>
                                <Button
                                  variant="outlined"
                                  startIcon={<AccountTreeIcon />}
                                  disabled={session.status !== 'closed'}
                                  onClick={() => updateUrlState({ gmSession: session.id, gmPlayer: null })}
                                >
                                  GM view
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  startIcon={<DeleteIcon />}
                                  disabled={session.status !== 'closed' || removeSessionMutation.isPending}
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Remove session "${session.title}"? This deletes all votes for it and rolls back its XP totals.`,
                                      )
                                    ) {
                                      removeSessionMutation.mutate(session.id);
                                    }
                                  }}
                                >
                                  Remove
                                </Button>
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      );
                    })}
                    </Stack>
                  </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            </>
            )}

            {workspacePage === 'stats' && (
            <Stack
              spacing={2}
              sx={{
                pr: { md: 0.5 },
                '& .MuiGrid-item': { display: 'flex' },
                '& .MuiGrid-item > .MuiCard-root': { width: '100%' },
              }}
            >
              <Grid container spacing={1.5}>
                <Grid item xs={6} md={2.4}>
                  <MetricCard label="Members" value={selectedGroup.members.length} />
                </Grid>
                <Grid item xs={6} md={2.4}>
                  <MetricCard label="Sessions" value={sessions.length} />
                </Grid>
                <Grid item xs={6} md={2.4}>
                  <MetricCard label="Closed" value={closedSessions.length} />
                </Grid>
                <Grid item xs={6} md={2.4}>
                  <MetricCard
                    label="Published"
                    value={sessions.filter((session) => session.results_published).length}
                  />
                </Grid>
                <Grid item xs={6} md={2.4}>
                  <MetricCard label="XP Pool" value={totalXpPool} helper="all sessions" />
                </Grid>
              </Grid>

              <Grid container spacing={1.5}>
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack>
                          <Typography variant="h3">Live Progress</Typography>
                          <Typography color="text.secondary">
                            {activeSession?.title ?? 'No active session'}
                          </Typography>
                        </Stack>
                        <Box>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                            <Typography fontWeight={800}>{Math.round(activeCompletion)}% complete</Typography>
                            <Typography color="text.secondary">
                              {activeProgress?.submitted_votes ?? 0} / {activeProgress?.total_players ?? 0}
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={activeCompletion}
                            sx={{ height: 10, borderRadius: 999 }}
                          />
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Chip label={`${closedSessions.length} closed`} color="success" size="small" />
                          <Chip
                            label={`${sessions.filter((session) => session.status === 'draft').length} drafts`}
                            size="small"
                          />
                          <Chip
                            label={`${sessions.filter((session) => session.results_archived).length} archived`}
                            size="small"
                          />
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <GroupChartCard title="Player Participation Rate" data={participationData} type="bar" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <GroupChartCard title="XP Pool Trend" data={xpPoolData} type="line" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <GroupChartCard title="Group XP Leaders" data={playerXpTotals} type="bar" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <GroupChartCard
                    title={selectedSession ? `${selectedSession.title} XP Split` : 'Latest XP Split'}
                    data={latestResultDistribution}
                    type="pie"
                  />
                </Grid>
              </Grid>
            </Stack>
            )}
          </Stack>
        </Paper>
      )}
      <Dialog
        open={Boolean(selectedGmSessionId)}
        onClose={() => updateUrlState({ gmSession: null, gmPlayer: null })}
        fullWidth
        maxWidth="xl"
        PaperProps={{ sx: { maxHeight: '92dvh' } }}
      >
        <DialogTitle sx={{ pr: 7 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
            <Stack>
              <Typography variant="h3">GM Session View</Typography>
              <Typography color="text.secondary">
                {gmSession ? `${gmSession.title} vote details` : 'Close a session to inspect its vote details.'}
              </Typography>
            </Stack>
            {gmView && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <FormControlLabel
                  control={(
                    <Switch
                      checked={showGmUsernames}
                      onChange={(event) => setShowGmUsernames(event.target.checked)}
                    />
                  )}
                  label={showGmUsernames ? 'Usernames' : 'Display names'}
                />
                <Chip label={`${gmView.total_points} XP assigned`} color="primary" sx={{ fontWeight: 800 }} />
              </Stack>
            )}
          </Stack>
          <IconButton
            aria-label="Close GM session view"
            onClick={() => updateUrlState({ gmSession: null, gmPlayer: null })}
            sx={{ position: 'absolute', right: 12, top: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {!gmSession && <Typography color="text.secondary">No closed session available.</Typography>}
            {gmSession && !gmView && <Typography color="text.secondary">No vote details loaded yet.</Typography>}
            {gmView && selectedGroup && (
              <>
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={1.25}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                        <Typography fontWeight={900}>Player Notes To GM</Typography>
                        <Chip label={`${gmPrivateNotes.length} players`} color="secondary" sx={{ fontWeight: 800 }} />
                      </Stack>
                      {gmPrivateNotes.length === 0 && (
                        <Typography color="text.secondary" variant="body2">
                          No private GM notes in this session.
                        </Typography>
                      )}
                      <Grid container spacing={1.25}>
                        {gmPrivateNotes.map((entry) => (
                          <Grid item xs={12} md={6} key={entry.playerId}>
                            <Box sx={{ p: 1.25, borderRadius: 2, border: '1px solid rgba(124,58,237,0.18)', bgcolor: 'rgba(124,58,237,0.06)' }}>
                              <Typography fontWeight={900} sx={{ mb: 0.75 }}>
                                {gmPlayerLabel(entry.playerId, entry.player)}
                              </Typography>
                              <Stack component="ul" spacing={0.75} sx={{ m: 0, p: 0, listStyle: 'none' }}>
                                {entry.notes.map((note) => (
                                  <Typography component="li" key={note} variant="body2">
                                    {note}
                                  </Typography>
                                ))}
                              </Stack>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Stack>
                  </CardContent>
                </Card>
                <Stack spacing={1.5}>
                  {gmRankingCards.map((playerCard, index) => {
                    const isSelected = selectedGmPlayer?.id === playerCard.id;
                    return (
                      <Card
                        key={playerCard.id}
                        variant="outlined"
                        onClick={() => updateUrlState({ gmPlayer: playerCard.id })}
                        sx={{
                          cursor: 'pointer',
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          boxShadow: isSelected ? '0 0 0 2px rgba(24,92,80,0.12)' : 'none',
                        }}
                      >
                        <CardContent>
                          <Stack spacing={1.5}>
                            <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="flex-start">
                              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <Avatar
                                  src={playerCard.avatar_url ?? undefined}
                                  sx={{
                                    width: 42,
                                    height: 42,
                                    bgcolor: playerCard.profile_color,
                                    flex: '0 0 auto',
                                    fontWeight: 900,
                                  }}
                                >
                                  {gmPlayerLabel(playerCard.id, playerCard.name).charAt(0)}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="h3" noWrap>
                                    #{index + 1} {gmPlayerLabel(playerCard.id, playerCard.name)}
                                  </Typography>
                                  <Typography color="text.secondary" variant="body2" noWrap>
                                    {playerCard.incoming.length} received comments, {playerCard.gmNotes.length} GM notes
                                  </Typography>
                                </Box>
                              </Stack>
                              <Typography
                                fontWeight={900}
                                sx={{
                                  flex: '0 0 auto',
                                  px: 1.25,
                                  py: 0.5,
                                  borderRadius: 2,
                                  bgcolor: 'rgba(17,24,39,0.06)',
                                }}
                              >
                                {playerCard.xpReceived} EXP
                              </Typography>
                            </Stack>
                            {playerCard.incoming.length > 0 && (
                              <Stack component="ul" spacing={0.75} sx={{ m: 0, p: 0, listStyle: 'none' }}>
                                {playerCard.incoming.map((vote) => (
                                  <Box
                                    component="li"
                                    key={`incoming-${vote.id}`}
                                    sx={{
                                      px: 1.25,
                                      py: 0.9,
                                      borderRadius: 2,
                                      border: '1px solid rgba(17,24,39,0.10)',
                                      bgcolor: 'rgba(255,255,255,0.42)',
                                    }}
                                  >
                                    <Typography fontWeight={900} variant="body2">
                                      {gmPlayerLabel(vote.voter_id, vote.voter)} gave {vote.points} EXP
                                    </Typography>
                                    <Typography variant="body2" color={vote.justification ? 'text.primary' : 'text.secondary'}>
                                      {vote.justification || 'No player comment.'}
                                    </Typography>
                                  </Box>
                                ))}
                              </Stack>
                            )}
                            {playerCard.gmNotes.length > 0 && (
                              <Box sx={{ p: 1.25, borderRadius: 2, border: '1px solid rgba(124,58,237,0.18)', bgcolor: 'rgba(124,58,237,0.06)' }}>
                                <Typography fontWeight={900} sx={{ mb: 0.75 }}>Notes To GM</Typography>
                                <Stack component="ul" spacing={0.75} sx={{ m: 0, p: 0, listStyle: 'none' }}>
                                  {playerCard.gmNotes.map((vote) => (
                                    <Typography component="li" key={`gm-note-${vote.id}`} variant="body2">
                                      {vote.gm_note}
                                    </Typography>
                                  ))}
                                </Stack>
                              </Box>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography fontWeight={900}>All Vote Lines</Typography>
                      <Grid container spacing={1.5}>
                        {gmView.votes.map((vote) => (
                          <Grid item xs={12} md={6} key={vote.id}>
                            <Box sx={{ p: 1.25, border: '1px solid #edf0f5', borderRadius: 1 }}>
                              <Typography fontWeight={900}>
                                {gmPlayerLabel(vote.voter_id, vote.voter)} gave {vote.points} XP to{' '}
                                {gmPlayerLabel(vote.recipient_id, vote.recipient)}
                              </Typography>
                              {vote.justification ? (
                                <Typography variant="body2">{vote.justification}</Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">No player note.</Typography>
                              )}
                              {vote.gm_note && (
                                <Typography variant="body2" fontWeight={800}>
                                  Note to GM: {vote.gm_note}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Stack>
                  </CardContent>
                </Card>
              </>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

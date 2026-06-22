import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { endpoints } from '../../api/endpoints';
import { LoadingState } from '../../shared/ui/LoadingState';
import { useActiveSession } from '../../hooks/useActiveSession';
import type { PublishedSessionResults, VoteLine } from '../../types/api';

export function VotePage() {
  const navigate = useNavigate();
  const { data: session, isLoading: sessionLoading } = useActiveSession();
  const isVotingOpen = session?.status === 'active';
  const isPublishedResult = session?.status === 'closed' && session.results_published && !session.results_archived;
  const { data: recipients = [], isLoading: recipientsLoading } = useQuery({
    queryKey: ['vote-recipients', session?.id],
    queryFn: () => endpoints.recipients(session!.id),
    enabled: Boolean(session && isVotingOpen),
  });
  const { data: voteStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['vote-status', session?.id],
    queryFn: () => endpoints.voteStatus(session!.id),
    enabled: Boolean(session && isVotingOpen),
  });
  const { data: publishedResults = [], isLoading: publishedLoading } = useQuery({
    queryKey: ['published-results'],
    queryFn: endpoints.publishedResults,
    enabled: Boolean(isPublishedResult),
  });
  const [lines, setLines] = useState<Record<number, VoteLine>>({});
  const [gmNote, setGmNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!session) return;
      await endpoints.submitVotes(session.id, { votes: Object.values(lines), gm_note: gmNote });
    },
    onSuccess: () => navigate('/vote/success'),
    onError: () => setError('Submission failed. Check your remaining points and try again.'),
  });

  const used = useMemo(() => Object.values(lines).reduce((sum, line) => sum + line.points, 0), [lines]);
  const remaining = (session?.points_pool ?? 0) - used;
  const progress = session?.points_pool ? Math.min((used / session.points_pool) * 100, 100) : 0;
  const allPointsValid = Object.values(lines).every((line) => line.points % 5 === 0);
  const canSubmit = Boolean(session && isVotingOpen) && remaining === 0 && allPointsValid && !submitMutation.isPending;

  useEffect(() => {
    if (isVotingOpen && voteStatus?.submitted) {
      navigate('/vote/success', { replace: true });
    }
  }, [isVotingOpen, navigate, voteStatus?.submitted]);

  function updateLine(recipientId: number, patch: Partial<VoteLine>) {
    setLines((current) => {
      const existing = current[recipientId] ?? { recipient_id: recipientId, points: 0, justification: '' };
      return { ...current, [recipientId]: { ...existing, ...patch } };
    });
  }

  if (sessionLoading || recipientsLoading || statusLoading || publishedLoading) return <LoadingState />;

  if (!session) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '55dvh', display: 'grid', placeItems: 'center', py: 5 }}>
        <Stack spacing={1.5} textAlign="center" sx={{ color: '#f8fafc' }}>
          <Typography variant="h2">No voting session is active</Typography>
          <Typography sx={{ color: 'rgba(248,250,252,0.72)' }}>
            Come back when the game master opens voting.
          </Typography>
        </Stack>
      </Container>
    );
  }

  if (isPublishedResult) {
    const result = publishedResults.find((item) => item.session_id === session.id);
    return (
      <PublishedVoteResults session={result} pointsPool={session.points_pool} />
    );
  }

  return (
    <Container maxWidth="sm" sx={{ pt: { xs: 3, sm: 4 }, pb: 17 }}>
      <Stack spacing={2.5}>
        <Box
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: 2,
            color: '#f8fafc',
            background:
              'linear-gradient(135deg, rgba(215,180,106,0.18), rgba(139,92,246,0.14)), rgba(15,23,42,0.62)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 18px 44px rgba(2,6,23,0.28)',
          }}
        >
          <Typography variant="h2">{session.title}</Typography>
          <Typography sx={{ color: 'rgba(248,250,252,0.72)', mt: 0.75 }}>
            {session.description ?? 'Voting is now open.'}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
              <Typography variant="body2" sx={{ color: 'rgba(248,250,252,0.7)' }}>
                Commendations assigned
              </Typography>
              <Typography variant="body2" fontWeight={800}>
                {used} / {session.points_pool}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 9,
                borderRadius: 99,
                bgcolor: 'rgba(255,255,255,0.14)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 99,
                  background: 'linear-gradient(90deg, #d7b46a, #f59e0b)',
                },
              }}
            />
          </Box>
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        <Alert severity="info">
          Reasons you write for players will be anonymized when results are published.
        </Alert>
        {recipients.map((recipient) => {
          const line = lines[recipient.id] ?? { recipient_id: recipient.id, points: 0, justification: '' };
          const hasPoints = line.points > 0;
          return (
            <Card
              key={recipient.id}
              variant="outlined"
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderColor: hasPoints ? '#d7b46a' : 'rgba(215,180,106,0.22)',
                boxShadow: hasPoints
                  ? '0 20px 48px rgba(215, 180, 106, 0.20)'
                  : '0 18px 44px rgba(2, 6, 23, 0.18)',
                transform: hasPoints ? 'translateY(-2px)' : 'translateY(0)',
                '&::before': hasPoints
                  ? {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(135deg, rgba(215,180,106,0.14), rgba(139,92,246,0.06))',
                      pointerEvents: 'none',
                    }
                  : undefined,
              }}
            >
              <CardContent>
                <Stack spacing={3}>
                  <Stack direction="row" spacing={1.75} alignItems="center">
                    <Avatar
                      src={recipient.avatar_url ?? undefined}
                      sx={{
                        width: 52,
                        height: 52,
                        bgcolor: recipient.profile_color,
                        border: hasPoints ? '2px solid #d7b46a' : '2px solid rgba(17,24,39,0.08)',
                        boxShadow: hasPoints ? '0 10px 24px rgba(215,180,106,0.22)' : 'none',
                      }}
                    >
                      {recipient.display_name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h3" sx={{ overflowWrap: 'anywhere' }}>
                        {recipient.display_name}
                      </Typography>
                      <Typography variant="body2" color={hasPoints ? 'primary.main' : 'text.secondary'} fontWeight={700}>
                        {hasPoints ? `${line.points} XP assigned` : 'Ready for commendation'}
                      </Typography>
                    </Box>
                  </Stack>
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      bgcolor: hasPoints ? 'rgba(215,180,106,0.12)' : 'rgba(17,24,39,0.035)',
                      border: '1px solid',
                      borderColor: hasPoints ? 'rgba(215,180,106,0.35)' : 'rgba(17,24,39,0.06)',
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
                      <Typography fontWeight={800}>XP</Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                      <IconButton
                        aria-label={`Remove point from ${recipient.display_name}`}
                        onClick={() => updateLine(recipient.id, { points: Math.max(line.points - 5, 0) })}
                        sx={{
                          bgcolor: '#ffffff',
                          border: '1px solid rgba(17,24,39,0.08)',
                          '&:hover': { bgcolor: '#f8fafc' },
                        }}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <TextField
                        value={line.points}
                        type="number"
                        inputProps={{ min: 0, max: session.points_pool, step: 5, inputMode: 'numeric' }}
                        onChange={(event) => updateLine(recipient.id, { points: Number(event.target.value) })}
                        error={line.points % 5 !== 0}
                        helperText={line.points % 5 !== 0 ? 'Use multiples of 5' : undefined}
                        sx={{
                          width: 96,
                          '& input': {
                            textAlign: 'center',
                            fontSize: '1.35rem',
                            fontWeight: 850,
                            py: 1.15,
                          },
                        }}
                      />
                      <IconButton
                        aria-label={`Add point to ${recipient.display_name}`}
                        onClick={() => remaining >= 5 && updateLine(recipient.id, { points: line.points + 5 })}
                        sx={{
                          bgcolor: '#d7b46a',
                          color: '#111827',
                          '&:hover': { bgcolor: '#d7b46a' },
                        }}
                      >
                        <AddIcon />
                      </IconButton>
                    </Stack>
                    </Stack>
                  </Box>
                  <TextField
                    label="Reason"
                    value={line.justification}
                    onChange={(event) => updateLine(recipient.id, { justification: event.target.value })}
                    multiline
                    minRows={3}
                  />
                </Stack>
              </CardContent>
            </Card>
          );
        })}
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant="h3">Note for Game Master</Typography>
              <TextField
                label="Private note"
                value={gmNote}
                onChange={(event) => setGmNote(event.target.value)}
                multiline
                minRows={3}
                maxRows={6}
                fullWidth
                helperText="Only the game master can see this note."
              />
            </Stack>
          </CardContent>
        </Card>
      </Stack>
      <Box
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(15,23,42,0.94)',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          p: 2,
          boxShadow: '0 -18px 44px rgba(2, 6, 23, 0.36)',
          backdropFilter: 'blur(18px)',
          pb: 'calc(16px + env(safe-area-inset-bottom))',
        }}
      >
        <Container maxWidth="sm" disableGutters>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 99,
              mb: 1.5,
              bgcolor: 'rgba(255,255,255,0.14)',
              '& .MuiLinearProgress-bar': { borderRadius: 99, bgcolor: '#d7b46a' },
            }}
          />
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: 'rgba(248,250,252,0.64)' }}>
                Remaining Points
              </Typography>
              <Typography
                variant="h3"
                sx={{ color: remaining === 0 ? '#d7b46a' : remaining < 0 ? '#fca5a5' : '#f8fafc' }}
              >
                {remaining} / {session.points_pool}
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              disabled={!canSubmit}
              onClick={() => setConfirmOpen(true)}
              sx={{ minWidth: 150 }}
            >
              Submit Votes
            </Button>
          </Stack>
        </Container>
      </Box>
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            m: 2,
            textAlign: 'center',
            alignItems: 'center',
          },
        }}
      >
        <DialogTitle>Submit votes?</DialogTitle>
        <DialogContent sx={{ display: 'grid', placeItems: 'center' }}>
          <Typography>
            This locks your votes for this session. You will not be able to go back and edit them.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', width: '100%', px: 3, pb: 3 }}>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setConfirmOpen(false);
              submitMutation.mutate();
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

function PublishedVoteResults({
  session,
  pointsPool,
}: {
  session: PublishedSessionResults | undefined;
  pointsPool: number;
}) {
  if (!session) {
    return <LoadingState />;
  }
  const fullExpPool = session.results.reduce((sum, row) => sum + row.xp_awarded, 0) || pointsPool;
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 4 } }}>
      <Stack spacing={2.5}>
        <Box
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: 2,
            color: '#f8fafc',
            background:
              'linear-gradient(135deg, rgba(215,180,106,0.20), rgba(139,92,246,0.16)), rgba(15,23,42,0.64)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 18px 44px rgba(2,6,23,0.28)',
          }}
        >
          <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h2" sx={{ overflowWrap: 'anywhere' }}>
                {session.session_title}
              </Typography>
              <Typography sx={{ color: 'rgba(248,250,252,0.68)', mt: 0.5 }}>
                {session.group_name ?? 'No group'}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: '0 0 auto',
                px: { xs: 2, sm: 2.5 },
                py: { xs: 1.35, sm: 1.6 },
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.12)',
                textAlign: 'right',
              }}
            >
              <Typography variant="body2" sx={{ color: 'rgba(248,250,252,0.68)' }}>
                Full EXP Pool
              </Typography>
              <Typography fontWeight={900}>{fullExpPool} EXP</Typography>
            </Box>
          </Stack>
          <Typography sx={{ color: 'rgba(248,250,252,0.72)', mt: 2 }}>
            Published results are visible until the game master archives this session.
          </Typography>
        </Box>
        <Stack spacing={1.5}>
          {session.results.map((row, index) => (
            <Card key={row.player_id} variant="outlined">
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="flex-start">
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                      <Avatar
                        src={row.avatar_url ?? undefined}
                        sx={{
                          width: 42,
                          height: 42,
                          bgcolor: row.profile_color,
                          flex: '0 0 auto',
                        }}
                      >
                        {row.player.charAt(0)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h3" noWrap>
                          #{index + 1} {row.player}
                        </Typography>
                        <Typography color="text.secondary" variant="body2" noWrap>
                          @{row.username} - {row.percentage_of_points}% of all EXP
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
                      {row.xp_awarded} EXP
                    </Typography>
                  </Stack>
                  {row.comments.length > 0 && (
                    <Stack component="ul" spacing={0.75} sx={{ m: 0, p: 0, listStyle: 'none' }}>
                      {row.comments.map((comment) => (
                        <Typography
                          component="li"
                          key={comment.text}
                          variant="body2"
                          sx={{
                            px: 1.25,
                            py: 0.9,
                            borderRadius: 2,
                            border: '1px solid rgba(17,24,39,0.10)',
                            bgcolor: 'rgba(255,255,255,0.42)',
                          }}
                        >
                          {comment.text}
                        </Typography>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}

import HistoryIcon from '@mui/icons-material/History';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Button, Card, CardContent, Chip, Collapse, Container, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { endpoints } from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';
import { orderCommentsForPlayer } from '../../shared/lib/playerCommentOrder';
import { LoadingState } from '../../shared/ui/LoadingState';

export function SessionHistoryPage() {
  const { auth } = useAuth();
  const [expandedSessionIds, setExpandedSessionIds] = useState<number[]>([]);
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: endpoints.me,
  });

  if (isLoading || !data || !auth) return <LoadingState />;

  const playedSessions = data.history.filter((session) => session.participated && session.points_received > 0);
  const totalPoints = playedSessions.reduce((sum, session) => sum + session.points_received, 0);

  const toggleComments = (sessionId: number) => {
    setExpandedSessionIds((current) =>
      current.includes(sessionId) ? current.filter((id) => id !== sessionId) : [...current, sessionId],
    );
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 4 } }}>
      <Stack spacing={2.5}>
        <Box sx={{ color: '#f8fafc' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <HistoryIcon />
            <Typography variant="h2">Session History</Typography>
          </Stack>
          <Typography sx={{ color: 'rgba(248,250,252,0.7)', mt: 0.5 }}>
            All published sessions from your groups, including sessions you did not participate in.
          </Typography>
        </Box>

        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
              <Box>
                <Typography color="text.secondary">Sessions played</Typography>
                <Typography variant="h2">{playedSessions.length}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography color="text.secondary">Total EXP received</Typography>
                <Typography variant="h2">{totalPoints}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {data.history.length === 0 && (
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary">No published sessions in your groups yet.</Typography>
            </CardContent>
          </Card>
        )}

        <Stack spacing={1}>
        {data.history.map((session) => {
          const comments = orderCommentsForPlayer(
            session.comments,
            auth.user.id,
            session.session_id,
            (comment) => comment,
          );
          const commentsExpanded = expandedSessionIds.includes(session.session_id);

          return (
            <Card key={session.session_id} variant="outlined">
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Stack spacing={1.25}>
                  <Typography variant="h3" textAlign="center" sx={{ width: '100%', overflowWrap: 'anywhere' }}>
                    {session.session_title}
                  </Typography>
                  {session.session_description && (
                    <Typography color="text.secondary" variant="body2" textAlign="center">
                      {session.session_description}
                    </Typography>
                  )}
                  {!session.participated && (
                    <Chip
                      label="You did not participate"
                      size="small"
                      sx={{ alignSelf: 'center', fontWeight: 800 }}
                    />
                  )}

                  <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="center">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography color="text.secondary" variant="caption" fontWeight={800}>
                        GROUP
                      </Typography>
                      <Typography fontWeight={800} noWrap>
                        {session.group_name ?? 'No group'}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', flex: '0 0 auto' }}>
                      <Typography color="text.secondary" variant="caption" fontWeight={800}>
                        EXP
                      </Typography>
                      <Typography fontWeight={900}>
                        {session.participated
                          ? `${session.points_received} / ${session.max_points_available}`
                          : 'Not applicable'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Button
                    variant="text"
                    fullWidth
                    disabled={!session.participated || comments.length === 0}
                    endIcon={(
                      <ExpandMoreIcon
                        sx={{ transform: commentsExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}
                      />
                    )}
                    onClick={() => toggleComments(session.session_id)}
                  >
                    {!session.participated
                      ? 'No participation details'
                      : comments.length === 0
                      ? 'No comments'
                      : commentsExpanded
                        ? 'Hide comments'
                        : `Show comments (${comments.length})`}
                  </Button>

                  <Collapse in={commentsExpanded} unmountOnExit>
                    <Stack component="ul" spacing={0.75} sx={{ m: 0, p: 0, listStyle: 'none' }}>
                      {comments.map((comment, index) => (
                        <Typography
                          component="li"
                          key={`${comment}-${index}`}
                          variant="body2"
                          sx={{
                            px: 1.25,
                            py: 0.9,
                            borderRadius: 2,
                            border: '1px solid rgba(17,24,39,0.10)',
                            bgcolor: 'rgba(255,255,255,0.42)',
                          }}
                        >
                          {comment}
                        </Typography>
                      ))}
                    </Stack>
                  </Collapse>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
        </Stack>
      </Stack>
    </Container>
  );
}

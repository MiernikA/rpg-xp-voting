import HistoryIcon from '@mui/icons-material/History';
import { Box, Card, CardContent, Container, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

import { endpoints } from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';
import { orderCommentsForPlayer } from '../../shared/lib/playerCommentOrder';
import { LoadingState } from '../../shared/ui/LoadingState';

export function SessionHistoryPage() {
  const { auth } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: endpoints.me,
  });

  if (isLoading || !data || !auth) return <LoadingState />;

  const totalPoints = data.history.reduce((sum, session) => sum + session.points_received, 0);

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 4 } }}>
      <Stack spacing={2.5}>
        <Box sx={{ color: '#f8fafc' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <HistoryIcon />
            <Typography variant="h2">Session History</Typography>
          </Stack>
          <Typography sx={{ color: 'rgba(248,250,252,0.7)', mt: 0.5 }}>
            All published sessions you participated in, including archived sessions.
          </Typography>
        </Box>

        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
              <Box>
                <Typography color="text.secondary">Sessions played</Typography>
                <Typography variant="h2">{data.history.length}</Typography>
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
              <Typography color="text.secondary">No published session history yet.</Typography>
            </CardContent>
          </Card>
        )}

        {data.history.map((session) => {
          const comments = orderCommentsForPlayer(
            session.comments,
            auth.user.id,
            session.session_id,
            (comment) => comment,
          );

          return (
            <Card key={session.session_id} variant="outlined">
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h3" sx={{ overflowWrap: 'anywhere' }}>
                        {session.session_title}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {session.group_name ?? 'No group'}
                      </Typography>
                    </Box>
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
                      {session.points_received} / {session.max_points_available} EXP
                    </Typography>
                  </Stack>

                  {comments.length > 0 ? (
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
                  ) : (
                    <Typography color="text.secondary" variant="body2">
                      No comments received in this session.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Container>
  );
}

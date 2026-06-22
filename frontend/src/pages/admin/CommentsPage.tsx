import { Card, CardContent, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { endpoints } from '../../api/endpoints';

export function CommentsPage() {
  const [keyword, setKeyword] = useState('');
  const [sessionId, setSessionId] = useState<number | ''>('');
  const { data: sessions = [] } = useQuery({ queryKey: ['sessions'], queryFn: () => endpoints.sessions() });
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', keyword, sessionId],
    queryFn: () => endpoints.comments({ keyword: keyword || undefined, session_id: sessionId || undefined }),
  });

  return (
    <Stack spacing={3}>
      <Typography variant="h2">Comments</Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <TextField label="Search keyword" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        <TextField select label="Session" value={sessionId} onChange={(event) => setSessionId(Number(event.target.value) || '')} sx={{ minWidth: 260 }}>
          <MenuItem value="">All sessions</MenuItem>
          {sessions.map((session) => (
            <MenuItem key={session.id} value={session.id}>
              {session.title}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <Grid container spacing={2}>
        {comments.map((comment, index) => (
          <Grid item xs={12} md={6} key={`${comment.session_id}-${comment.recipient_id}-${index}`}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h3">{comment.recipient}</Typography>
                  <Typography color="text.secondary">
                    {comment.session_title} - +{comment.points} - {comment.voter ?? 'Anonymous'}
                  </Typography>
                  {comment.justification && <Typography>{comment.justification}</Typography>}
                  {comment.gm_note && (
                    <Typography variant="body2" fontWeight={800}>
                      GM note: {comment.gm_note}
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

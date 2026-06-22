import DownloadIcon from '@mui/icons-material/Download';
import ArchiveIcon from '@mui/icons-material/Archive';
import CampaignIcon from '@mui/icons-material/Campaign';
import SearchIcon from '@mui/icons-material/Search';
import { Alert, Button, Card, CardContent, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { endpoints } from '../../api/endpoints';
import { api } from '../../shared/api/client';
import { LoadingState } from '../../shared/ui/LoadingState';

export function ResultsPage() {
  const queryClient = useQueryClient();
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({ queryKey: ['sessions'], queryFn: () => endpoints.sessions() });
  const closedSessions = sessions.filter((session) => session.status === 'closed');
  const [sessionId, setSessionId] = useState<number | ''>('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedId = typeof sessionId === 'number' ? sessionId : closedSessions[0]?.id;
  const selectedSession = sessions.find((session) => session.id === selectedId);
  const { data: results = [], isLoading: resultsLoading } = useQuery({
    queryKey: ['results', selectedId],
    queryFn: () => endpoints.results(selectedId),
    enabled: Boolean(selectedId),
  });
  const { data: progress } = useQuery({
    queryKey: ['session-progress', selectedId],
    queryFn: () => endpoints.progress(selectedId),
    enabled: Boolean(selectedId),
    refetchInterval: selectedSession?.status === 'active' ? 5000 : false,
  });
  const allVoted = Boolean(progress && progress.total_players > 0 && progress.submitted_votes >= progress.total_players);
  const publishMutation = useMutation({
    mutationFn: endpoints.publishResults,
    onSuccess: () => {
      setError(null);
      setMessage('Results published for players.');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['published-results'] });
    },
    onError: () => {
      setMessage(null);
      setError('Could not publish results. Make sure every participant has voted.');
    },
  });
  const archiveMutation = useMutation({
    mutationFn: endpoints.archiveResults,
    onSuccess: () => {
      setError(null);
      setMessage('Session archived. Players will no longer see it on Vote.');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['published-results'] });
    },
    onError: () => {
      setMessage(null);
      setError('Could not archive this session.');
    },
  });

  async function download(path: string, filename: string) {
    const response = await api.get(path, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (sessionsLoading || resultsLoading) return <LoadingState />;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <Typography variant="h2" sx={{ flex: 1 }}>
          Results
        </Typography>
        <Button component={Link} to="/admin/results/comments" startIcon={<SearchIcon />} variant="outlined">
          Comments
        </Button>
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          select
          label="Closed session"
          value={selectedId ?? ''}
          onChange={(event) => setSessionId(Number(event.target.value))}
          sx={{ minWidth: 280 }}
        >
          {closedSessions.map((session) => (
            <MenuItem key={session.id} value={session.id}>
              {session.title}
            </MenuItem>
          ))}
        </TextField>
        {selectedId && (
          <>
            <Button
              startIcon={<CampaignIcon />}
              variant="contained"
              disabled={!allVoted || selectedSession?.results_published || publishMutation.isPending}
              onClick={() => publishMutation.mutate(selectedId)}
            >
              {selectedSession?.results_published ? 'Published' : 'Publish results'}
            </Button>
            <Button
              startIcon={<ArchiveIcon />}
              variant="outlined"
              disabled={!selectedSession?.results_published || selectedSession.results_archived || archiveMutation.isPending}
              onClick={() => archiveMutation.mutate(selectedId)}
            >
              {selectedSession?.results_archived ? 'Archived' : 'Archive session'}
            </Button>
            <Button startIcon={<DownloadIcon />} onClick={() => download(`/results/${selectedId}/export.csv`, `session-${selectedId}.csv`)}>
              CSV
            </Button>
            <Button startIcon={<DownloadIcon />} onClick={() => download(`/results/${selectedId}/export.xlsx`, `session-${selectedId}.xlsx`)}>
              Excel
            </Button>
          </>
        )}
      </Stack>
      {progress && (
        <Typography color="text.secondary">
          Participants voted: {progress.submitted_votes} / {progress.total_players}
        </Typography>
      )}
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      <Grid container spacing={2}>
        {results.map((row, index) => (
          <Grid item xs={12} md={6} key={row.player_id}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Typography color="text.secondary">Rank #{index + 1}</Typography>
                  <Typography variant="h3">{row.player}</Typography>
                  <Typography variant="h2">{row.total_points} points</Typography>
                  <Typography color="text.secondary">
                    {row.average_points} avg - {row.number_of_voters} voters - {row.percentage_of_points}% - {row.xp_awarded} XP
                  </Typography>
                  {row.comments.slice(0, 3).map((comment) => (
                    <Typography key={`${comment.author}-${comment.text}`} variant="body2">
                      {comment.author ?? 'Anonymous'}: "{comment.text}"
                    </Typography>
                  ))}
                  {row.gm_notes.slice(0, 2).map((note) => (
                    <Typography key={`gm-${note.author}-${note.text}`} variant="body2" fontWeight={800}>
                      GM note from {note.author ?? 'Anonymous'}: "{note.text}"
                    </Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

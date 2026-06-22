import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

import { endpoints } from '../../api/endpoints';
import { D3Chart } from '../../shared/ui/D3Chart';
import { LoadingState } from '../../shared/ui/LoadingState';
import type { ChartPoint } from '../../types/api';

function ChartCard({ title, data, type }: { title: string; data: ChartPoint[]; type: 'bar' | 'line' }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2.5}>
          <Typography variant="h3">{title}</Typography>
          {data.length === 0 ? (
            <Typography color="text.secondary">No data yet.</Typography>
          ) : (
            <D3Chart data={data} type={type} height={260} />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function StatisticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['statistics'], queryFn: endpoints.statistics });
  if (isLoading) return <LoadingState />;

  return (
    <Stack spacing={3.5}>
      <Stack spacing={0.75}>
        <Typography variant="h2">Statistics</Typography>
        <Typography color="text.secondary">Participation, rankings, and point trends.</Typography>
      </Stack>
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <ChartCard title="Votes over time" data={data?.votes_over_time ?? []} type="line" />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Participation rate" data={data?.participation_rate ?? []} type="bar" />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Player rankings" data={data?.player_rankings ?? []} type="bar" />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Average points by session" data={data?.average_points_by_session ?? []} type="line" />
        </Grid>
      </Grid>
    </Stack>
  );
}

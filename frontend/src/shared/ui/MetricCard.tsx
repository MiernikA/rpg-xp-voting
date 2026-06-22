import { Card, CardContent, Typography } from '@mui/material';

interface MetricCardProps {
  label: string;
  value: string | number;
  helper?: string;
}

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '0 auto 0 0',
          width: 4,
          bgcolor: 'primary.main',
          opacity: 0.86,
        },
      }}
    >
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Typography color="text.secondary" variant="body2" fontWeight={700}>
          {label}
        </Typography>
        <Typography component="div" variant="h2" sx={{ wordBreak: 'break-word' }}>
          {value}
        </Typography>
        {helper && (
          <Typography color="text.secondary" variant="body2">
            {helper}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

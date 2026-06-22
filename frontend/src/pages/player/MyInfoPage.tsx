import SaveIcon from '@mui/icons-material/Save';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import { endpoints } from '../../api/endpoints';
import { LoadingState } from '../../shared/ui/LoadingState';
import { useAuth } from '../../hooks/useAuth';
import type { PlayerLayoutOutletContext } from '../../layouts/PlayerLayout';
import { getApiErrorMessage } from '../../shared/api/apiError';

const paperPalettes = [
  { label: 'Astral Gold', primary: '#d7b46a', secondary: '#8b5cf6', background: '#111827', paper: '#fff7df' },
  { label: 'Forest Camp', primary: '#7dd3a7', secondary: '#d7b46a', background: '#10231f', paper: '#eef8e8' },
  { label: 'Arcane Ink', primary: '#c4b5fd', secondary: '#f59e0b', background: '#17122a', paper: '#f4efff' },
  { label: 'Dungeon Map', primary: '#f4c76d', secondary: '#b85c38', background: '#1f2937', paper: '#f3ead7' },
  { label: 'Crimson Keep', primary: '#f0b45f', secondary: '#b91c1c', background: '#1c1116', paper: '#fff1e7' },
  { label: 'Moonlit Tome', primary: '#a5b4fc', secondary: '#38bdf8', background: '#101827', paper: '#eef4ff' },
  { label: 'Emerald Vault', primary: '#34d399', secondary: '#a3e635', background: '#09201c', paper: '#ecfdf3' },
  { label: 'Royal Violet', primary: '#facc15', secondary: '#a855f7', background: '#1e1235', paper: '#f8f1ff' },
  { label: 'Sunset Ledger', primary: '#fb7185', secondary: '#fbbf24', background: '#211416', paper: '#fff4ed' },
  { label: 'Sapphire Hall', primary: '#60a5fa', secondary: '#14b8a6', background: '#0b1d33', paper: '#eaf6ff' },
  { label: 'Copper Grove', primary: '#f97316', secondary: '#84cc16', background: '#1d1a12', paper: '#fff7e6' },
  { label: 'Frost Rune', primary: '#67e8f9', secondary: '#818cf8', background: '#0c1823', paper: '#edf9ff' },
  { label: 'Rose Chapel', primary: '#f9a8d4', secondary: '#c084fc', background: '#241424', paper: '#fff0f7' },
  { label: 'Obsidian Mint', primary: '#5eead4', secondary: '#f8fafc', background: '#071816', paper: '#eafff9' },
  { label: 'Amber Library', primary: '#f59e0b', secondary: '#22c55e', background: '#20160d', paper: '#fff8dc' },
  { label: 'Steel Banner', primary: '#93c5fd', secondary: '#f472b6', background: '#111827', paper: '#f1f5f9' },
  { label: 'Ruby Forge', primary: '#ef4444', secondary: '#f97316', background: '#220f0f', paper: '#fff1f2' },
  { label: 'Teal Harbor', primary: '#2dd4bf', secondary: '#38bdf8', background: '#082f33', paper: '#e6fffb' },
  { label: 'Lavender Field', primary: '#c084fc', secondary: '#f0abfc', background: '#211330', paper: '#faf0ff' },
  { label: 'Moss Lantern', primary: '#bef264', secondary: '#facc15', background: '#16210d', paper: '#f7fee7' },
  { label: 'Night Bazaar', primary: '#f472b6', secondary: '#22d3ee', background: '#120f24', paper: '#fdf2f8' },
  { label: 'Ivory Quest', primary: '#2563eb', secondary: '#dc2626', background: '#192033', paper: '#fffaf0' },
  { label: 'Cinder Bloom', primary: '#fb7185', secondary: '#a3e635', background: '#201014', paper: '#fff5f5' },
  { label: 'Glacier Coin', primary: '#38bdf8', secondary: '#facc15', background: '#0b2239', paper: '#effaff' },
  { label: 'Plum Lantern', primary: '#e879f9', secondary: '#fb923c', background: '#25112b', paper: '#fdf4ff' },
  { label: 'Pine Copper', primary: '#34d399', secondary: '#f97316', background: '#0d2119', paper: '#f0fdf4' },
  { label: 'Cloud Script', primary: '#64748b', secondary: '#0ea5e9', background: '#111827', paper: '#f8fafc' },
  { label: 'Golden Rose', primary: '#facc15', secondary: '#fb7185', background: '#21160f', paper: '#fff7ed' },
];

export function MyInfoPage() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  const { setThemePreview } = useOutletContext<PlayerLayoutOutletContext>();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [themePrimary, setThemePrimary] = useState('#6f4e37');
  const [themeSecondary, setThemeSecondary] = useState('#8f3f2f');
  const [themeBackground, setThemeBackground] = useState('#f4ead7');
  const [themePaper, setThemePaper] = useState('#fff7df');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<number | null>(null);
  const [openGroupId, setOpenGroupId] = useState<number | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: endpoints.me,
  });

  useEffect(() => {
    if (!data || loadedUserId === data.user.id) return;
    setDisplayName(data.user.display_name);
    setAvatarUrl(data.user.avatar_url ?? '');
    setThemePrimary(data.user.theme_primary);
    setThemeSecondary(data.user.theme_secondary);
    setThemeBackground(data.user.theme_background);
    setThemePaper(data.user.theme_paper ?? '#fff7df');
    setLoadedUserId(data.user.id);
  }, [data, loadedUserId]);

  useEffect(() => {
    setThemePreview({
      primary: themePrimary,
      secondary: themeSecondary,
      background: themeBackground,
      paper: themePaper,
    });
  }, [setThemePreview, themeBackground, themePaper, themePrimary, themeSecondary]);

  useEffect(() => () => setThemePreview(null), [setThemePreview]);

  const updateMutation = useMutation({
    mutationFn: endpoints.updateMe,
    onSuccess: (user) => {
      updateUser(user);
      setDisplayName(user.display_name);
      setAvatarUrl(user.avatar_url ?? '');
      setThemePrimary(user.theme_primary);
      setThemeSecondary(user.theme_secondary);
      setThemeBackground(user.theme_background);
      setThemePaper(user.theme_paper ?? '#fff7df');
      setLoadedUserId(user.id);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setError(null);
      setMessage('Profile updated.');
    },
    onError: (err) => {
      setMessage(null);
      setError(getApiErrorMessage(err, 'Could not update profile.'));
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextDisplayName = displayName.trim();
    if (!nextDisplayName) {
      setMessage(null);
      setError('Display name is required.');
      return;
    }
    updateMutation.mutate({
      display_name: nextDisplayName,
      avatar_url: avatarUrl || null,
      theme_primary: themePrimary,
      theme_secondary: themeSecondary,
      theme_background: themeBackground,
      theme_paper: themePaper,
    });
  }

  function selectAvatar(file: File | undefined) {
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('Choose a PNG or JPG image.');
      return;
    }
    if (file.size > 1_500_000) {
      setError('Avatar image must be under 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(String(reader.result));
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  if (isLoading || !data) return <LoadingState />;

  const totalPoints = data.history.reduce((sum, row) => sum + row.points_received, 0);
  const activePalette = paperPalettes.find(
    (palette) =>
      palette.primary === themePrimary &&
      palette.secondary === themeSecondary &&
      palette.background === themeBackground &&
      palette.paper === themePaper,
  );

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 4 } }}>
      <Stack spacing={3}>
        <Box sx={{ color: '#f8fafc' }}>
          <Typography variant="h2">My Info</Typography>
          <Typography sx={{ color: 'rgba(248,250,252,0.7)' }}>
            Profile image, app schemes, groups, and XP history.
          </Typography>
        </Box>
        <Card component="form" onSubmit={submit} variant="outlined" sx={{ bgcolor: themePaper }}>
          <CardContent>
            <Stack spacing={3} sx={{ width: '100%' }}>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${themePrimary}22, ${themeSecondary}18)`,
                  border: '1px solid rgba(17,24,39,0.06)',
                  width: '100%',
                }}
              >
                <Avatar
                  src={avatarUrl || undefined}
                  sx={{
                    width: 76,
                    height: 76,
                    bgcolor: themePrimary,
                    border: '3px solid #ffffff',
                    boxShadow: '0 14px 28px rgba(17,24,39,0.18)',
                    flex: '0 0 auto',
                  }}
                >
                  {displayName.charAt(0)}
                </Avatar>
                <Stack sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h3" noWrap>
                    {displayName || data.user.display_name}
                  </Typography>
                  <Typography color="text.secondary" noWrap>
                    @{data.user.username} - {data.user.role}
                  </Typography>
                </Stack>
              </Stack>
              <Box sx={{ width: '100%' }}>
                <Typography fontWeight={800} sx={{ mb: 1 }}>
                  Display name
                </Typography>
                <Box
                  component="input"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.currentTarget.value)}
                  sx={{
                    width: '100%',
                    minHeight: 52,
                    px: 1.75,
                    borderRadius: 2,
                    border: '1px solid #d0d5dd',
                    font: 'inherit',
                    fontWeight: 700,
                    outline: 'none',
                    '&:focus': {
                      borderColor: themePrimary,
                      boxShadow: `0 0 0 4px ${themePrimary}30`,
                    },
                  }}
                />
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }}>
                <Button variant="outlined" component="label" fullWidth>
                  Upload PNG or JPG
                  <input
                    hidden
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(event) => selectAvatar(event.target.files?.[0])}
                  />
                </Button>
                <Button variant="outlined" color="error" onClick={() => setAvatarUrl('')} fullWidth>
                  Remove image
                </Button>
              </Stack>
              <Box sx={{ width: '100%' }}>
                <Typography fontWeight={800} sx={{ mb: 1.5 }}>
                  App color scheme
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                    gap: 1.5,
                    width: '100%',
                    maxHeight: 240,
                    overflowY: 'auto',
                    pr: 0.5,
                  }}
                >
                  {paperPalettes.map((palette) => (
                    <Button
                      key={palette.label}
                      fullWidth
                      variant="outlined"
                      onClick={() => {
                        setThemePrimary(palette.primary);
                        setThemeSecondary(palette.secondary);
                        setThemeBackground(palette.background);
                        setThemePaper(palette.paper);
                      }}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) auto',
                        alignItems: 'center',
                        gap: 1,
                        justifyContent: 'normal',
                        minHeight: 64,
                        px: 1.5,
                        borderColor: palette.primary,
                        borderWidth: activePalette?.label === palette.label ? 3 : 1,
                        color: '#f8fafc',
                        bgcolor: palette.background,
                        backgroundImage: `linear-gradient(135deg, ${palette.primary}44, ${palette.secondary}33)`,
                        '&:hover': {
                          bgcolor: palette.background,
                          borderColor: palette.primary,
                        },
                      }}
                    >
                      <Typography component="span" fontWeight={800} noWrap sx={{ textAlign: 'left' }}>
                        {palette.label}
                      </Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flex: '0 0 auto' }}>
                        {[palette.primary, palette.secondary, palette.paper].map((color) => (
                          <Box
                            key={color}
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              bgcolor: color,
                              border: '1px solid rgba(255,255,255,0.65)',
                            }}
                          />
                        ))}
                      </Stack>
                    </Button>
                  ))}
                </Box>
              </Box>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={updateMutation.isPending}
                size="large"
                fullWidth
              >
                Save profile
              </Button>
              {message && <Alert severity="success">{message}</Alert>}
              {error && <Alert severity="error">{error}</Alert>}
            </Stack>
          </CardContent>
        </Card>

        <Box
          sx={{
            display: 'grid',
            width: '100%',
          }}
        >
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="text.secondary">Total points received</Typography>
              <Typography variant="h2">{totalPoints}</Typography>
            </CardContent>
          </Card>
        </Box>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="h3">My Groups</Typography>
              {data.groups.length === 0 && <Typography color="text.secondary">No groups yet.</Typography>}
              {data.groups.map((group) => (
                <Stack key={group.id} spacing={1}>
                  <Button
                    fullWidth
                    variant="text"
                    onClick={() => setOpenGroupId(openGroupId === group.id ? null : group.id)}
                    sx={{
                      justifyContent: 'space-between',
                      px: 1.5,
                      py: 1.25,
                      borderRadius: 2,
                      bgcolor: 'rgba(17,24,39,0.04)',
                      color: 'text.primary',
                      fontWeight: 800,
                      textAlign: 'left',
                      '&:hover': { bgcolor: 'rgba(17,24,39,0.07)', boxShadow: 'none' },
                    }}
                  >
                    <span>{group.name}</span>
                    <Typography component="span" variant="body2" color="text.secondary">
                      {openGroupId === group.id ? 'Hide' : 'Members'}
                    </Typography>
                  </Button>
                  {openGroupId === group.id && (
                    <Stack spacing={0.75} sx={{ pl: 1 }}>
                      {group.members.map((member) => (
                        <Stack
                          key={member.id}
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          sx={{
                            px: 1.25,
                            py: 1,
                            borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.45)',
                          }}
                        >
                          <Avatar
                            src={member.avatar_url ?? undefined}
                            sx={{ width: 28, height: 28, bgcolor: member.profile_color, fontSize: 12 }}
                          >
                            {member.display_name.charAt(0)}
                          </Avatar>
                          <Typography fontWeight={700} noWrap>
                            {member.display_name}
                          </Typography>
                        </Stack>
                      ))}
                      {group.members.length === 0 && (
                        <Typography color="text.secondary" variant="body2" sx={{ px: 1.25 }}>
                          No members.
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Stack spacing={1.5}>
          <Typography variant="h3" sx={{ color: '#f8fafc' }}>
            Point History
          </Typography>
          {data.history.length === 0 && (
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary">No awarded points yet.</Typography>
              </CardContent>
            </Card>
          )}
          <Stack
            spacing={1}
            sx={{
              maxHeight: 520,
              overflowY: 'auto',
              pr: 0.5,
            }}
          >
            {data.history.map((row) => (
              <Card key={row.session_id} variant="outlined">
                <CardContent sx={{ py: 2.25 }}>
                  <Stack spacing={1.25}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={900} noWrap>
                          {row.session_title}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          {row.group_name ?? 'No group'}
                        </Typography>
                      </Box>
                      <Typography
                        fontWeight={900}
                        sx={{
                          flex: '0 0 auto',
                          px: 1.25,
                          py: 0.5,
                          borderRadius: 2,
                          bgcolor: `${themePrimary}22`,
                          color: 'text.primary',
                        }}
                      >
                        {row.points_received} / {row.max_points_available} EXP
                      </Typography>
                    </Stack>
                    <Typography color="text.secondary" variant="body2">
                      You received {row.points_received} EXP out of {row.max_points_available} possible from other players.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}

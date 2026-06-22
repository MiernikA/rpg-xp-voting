import HowToVoteIcon from '@mui/icons-material/HowToVote';
import InfoIcon from '@mui/icons-material/Info';
import LogoutIcon from '@mui/icons-material/Logout';
import { AppBar, Avatar, Box, Button, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { useAuth } from '../hooks/useAuth';

export interface PlayerThemePreview {
  primary: string;
  secondary: string;
  background: string;
  paper: string;
}

export interface PlayerLayoutOutletContext {
  setThemePreview: (preview: PlayerThemePreview | null) => void;
}

export function PlayerLayout() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [themePreview, setThemePreview] = useState<PlayerThemePreview | null>(null);
  const player = auth?.user;
  const primary = themePreview?.primary ?? player?.theme_primary ?? '#d7b46a';
  const secondary = themePreview?.secondary ?? player?.theme_secondary ?? '#8b5cf6';
  const background = themePreview?.background ?? player?.theme_background ?? '#111827';
  const paperSurface = themePreview?.paper ?? player?.theme_paper ?? '#fff7df';
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: '#0f172a',
        backgroundImage:
          `radial-gradient(circle at 18% 0%, ${secondary}40, transparent 28%), radial-gradient(circle at 88% 8%, ${primary}30, transparent 24%), linear-gradient(180deg, ${background} 0%, #0f172a 62%, #111827 100%)`,
        color: '#f8fafc',
      }}
    >
      <AppBar
        elevation={0}
        position="sticky"
        sx={{
          bgcolor: 'rgba(15, 23, 42, 0.86)',
          color: '#f8fafc',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <Toolbar sx={{ minHeight: 70, gap: { xs: 2.5, sm: 4 }, px: { xs: 2, sm: 3 } }}>
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0, flex: 1 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 2,
                bgcolor: `${primary}24`,
                border: `1px solid ${primary}66`,
                flex: '0 0 auto',
              }}
            >
              <HowToVoteIcon sx={{ color: primary }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h3" component="h1" noWrap>
                XP Voting
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, flex: '0 1 auto' }}>
            <Avatar
              src={player?.avatar_url ?? undefined}
              sx={{
                width: 34,
                height: 34,
                bgcolor: primary,
                border: '2px solid rgba(255,255,255,0.55)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.22)',
                display: { xs: 'none', sm: 'inline-flex' },
              }}
            >
              {(player?.display_name ?? 'U').charAt(0)}
            </Avatar>
            <Typography fontWeight={800} noWrap sx={{ maxWidth: { xs: 128, sm: 220 } }}>
              {player?.display_name ?? 'User'}
            </Typography>
          </Stack>
          <IconButton
            aria-label="Log out"
            sx={{ color: '#f8fafc' }}
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            width: '100%',
            px: 2,
            pb: 1.5,
          }}
        >
          <Button
            component={NavLink}
            to="/vote"
            startIcon={<HowToVoteIcon />}
            color="inherit"
            sx={{
              flex: 1,
              minWidth: 0,
              color: 'rgba(248,250,252,0.74)',
              border: '1px solid rgba(255,255,255,0.12)',
              '&.active': { bgcolor: primary, color: '#111827', borderColor: primary },
              '&:hover:not(.active)': { bgcolor: 'rgba(255,255,255,0.08)', boxShadow: 'none' },
            }}
          >
            Vote
          </Button>
          <Button
            component={NavLink}
            to="/me"
            startIcon={<InfoIcon />}
            color="inherit"
            sx={{
              flex: 1,
              minWidth: 0,
              color: 'rgba(248,250,252,0.74)',
              border: '1px solid rgba(255,255,255,0.12)',
              '&.active': { bgcolor: secondary, color: '#ffffff', borderColor: secondary },
              '&:hover:not(.active)': { bgcolor: 'rgba(255,255,255,0.08)', boxShadow: 'none' },
            }}
          >
            My Info
          </Button>
        </Stack>
      </AppBar>
      <Box
        sx={{
          '& .MuiCard-root, & .MuiPaper-root': {
            bgcolor: paperSurface,
            borderColor: `${primary}38`,
            boxShadow: '0 18px 44px rgba(2, 6, 23, 0.22)',
            backdropFilter: 'blur(10px)',
          },
          '& .MuiCardContent-root': { p: { xs: 3, sm: 4 } },
          '& .MuiContainer-root': { px: { xs: 2.5, sm: 4 } },
          '& .MuiButton-contained': {
            bgcolor: primary,
            color: '#111827',
            '&:hover': { bgcolor: primary },
          },
          '& .MuiOutlinedInput-root.Mui-focused': {
            boxShadow: `0 0 0 4px ${primary}30`,
          },
        }}
      >
        <Outlet context={{ setThemePreview } satisfies PlayerLayoutOutletContext} />
      </Box>
    </Box>
  );
}

import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import LogoutIcon from '@mui/icons-material/Logout';
import { AppBar, Avatar, Box, Button, Container, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

const links = [
  { to: '/admin', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/admin/groups/create', label: 'Create Group', icon: <AddIcon /> },
  { to: '/admin/groups/manage', label: 'Manage Groups', icon: <GroupsIcon /> },
  { to: '/admin/players', label: 'Players', icon: <GroupsIcon /> },
];

export function AdminLayout() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: '#f6f7fb',
        backgroundImage:
          'radial-gradient(circle at 12% -4%, rgba(24, 92, 80, 0.08), transparent 32%), linear-gradient(180deg, #ffffff 0%, #f6f7fb 340px)',
      }}
    >
      <AppBar
        elevation={0}
        position="sticky"
        sx={{
          bgcolor: 'rgba(255,255,255,0.92)',
          color: 'text.primary',
          borderBottom: '1px solid #e5e7eb',
          backdropFilter: 'blur(16px)',
        }}
      >
        <Toolbar
          sx={{
            gap: 2,
            minHeight: { xs: 72, md: 76 },
            alignItems: 'center',
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', md: 'minmax(0, 1fr) auto auto' },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3">RPG XP Voting</Typography>
            <Typography variant="body2" color="text.secondary">
              Game Master dashboard
            </Typography>
          </Box>
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{
              minHeight: 44,
              display: { xs: 'none', sm: 'flex' },
            }}
          >
            <Avatar sx={{ width: 38, height: 38, bgcolor: '#111827', fontSize: 16 }}>
              {(auth?.user.display_name ?? 'U').charAt(0)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary">
                Logged in as
              </Typography>
              <Typography fontWeight={800} lineHeight={1.1} noWrap>
                {auth?.user.display_name ?? 'User'} (@{auth?.user.username ?? 'unknown'})
              </Typography>
            </Box>
          </Stack>
          <IconButton
            aria-label="Log out"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            sx={{ justifySelf: 'end', width: 44, height: 44 }}
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            overflowX: 'auto',
            px: { xs: 2, md: 3 },
            pb: 1.5,
            alignItems: 'center',
            minHeight: 52,
            '& a': { whiteSpace: 'nowrap' },
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {links.map((link) => (
            <Button
              key={link.to}
              component={NavLink}
              to={link.to}
              end={link.to === '/admin'}
              startIcon={link.icon}
              color="inherit"
              sx={{
                px: 1.6,
                height: 38,
                flex: '0 0 auto',
                color: '#667085',
                border: '1px solid transparent',
                '&.active': {
                  bgcolor: '#111827',
                  color: '#ffffff',
                  borderColor: '#111827',
                  boxShadow: '0 10px 20px rgba(17, 24, 39, 0.12)',
                },
                '&:hover:not(.active)': {
                  bgcolor: '#f2f4f7',
                  color: '#111827',
                  boxShadow: 'none',
                },
              }}
            >
              {link.label}
            </Button>
          ))}
        </Stack>
      </AppBar>
      <Container
        maxWidth="xl"
        sx={{
          width: '100%',
          py: { xs: 4, md: 5 },
          px: { xs: 2.5, sm: 3.5, md: 5 },
          '& .MuiCard-root': {
            bgcolor: '#ffffff',
            borderColor: '#e6e8ef',
          },
          '& .MuiCard-root:hover': {
            boxShadow: '0 18px 44px rgba(17, 24, 39, 0.08)',
          },
          '& .MuiGrid-container': { alignItems: 'stretch' },
        }}
      >
        <Outlet />
      </Container>
    </Box>
  );
}

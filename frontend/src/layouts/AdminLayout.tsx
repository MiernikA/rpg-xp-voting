import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import LogoutIcon from '@mui/icons-material/Logout';
import { AppBar, Avatar, Box, Button, Container, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { APP_VERSION } from '../shared/config/appVersion';

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
        bgcolor: '#f7f7f8',
      }}
    >
      <AppBar
        elevation={0}
        position="sticky"
        sx={{
          bgcolor: '#ffffff',
          color: 'text.primary',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <Toolbar
          sx={{
            gap: 2,
            minHeight: 64,
            alignItems: 'center',
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', md: 'minmax(0, 1fr) auto auto' },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography variant="h3">RPG XP Voting</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={800}>
                v{APP_VERSION}
              </Typography>
            </Stack>
          </Box>
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{
              display: { xs: 'none', sm: 'flex' },
            }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#111827', fontSize: 14 }}>
              {(auth?.user.display_name ?? 'U').charAt(0)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={800} variant="body2" noWrap>
                {auth?.user.display_name ?? 'User'}
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
            minHeight: 46,
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
                height: 34,
                flex: '0 0 auto',
                color: '#667085',
                border: '1px solid transparent',
                '&.active': {
                  bgcolor: '#111827',
                  color: '#ffffff',
                  borderColor: '#111827',
                  boxShadow: 'none',
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
          py: { xs: 2.5, md: 3.5 },
          px: { xs: 2, sm: 3, md: 4 },
          '& .MuiCard-root': {
            bgcolor: '#ffffff',
            borderColor: '#e6e8ef',
            boxShadow: 'none',
          },
          '& .MuiGrid-container': { alignItems: 'stretch' },
        }}
      >
        <Outlet />
      </Container>
    </Box>
  );
}

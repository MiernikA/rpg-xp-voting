import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AdminLayout } from '../layouts/AdminLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { PlayerLayout } from '../layouts/PlayerLayout';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { CreateGroupPage } from '../pages/admin/CreateGroupPage';
import { GroupsPage } from '../pages/admin/GroupsPage';
import { PlayersPage } from '../pages/admin/PlayersPage';
import { LoginPage } from '../pages/LoginPage';
import { MyInfoPage } from '../pages/player/MyInfoPage';
import { VotePage } from '../pages/player/VotePage';
import { VoteSuccessPage } from '../pages/player/VoteSuccessPage';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute role="player" />,
    children: [
      {
        element: <PlayerLayout />,
        children: [
          { path: '/vote', element: <VotePage /> },
          { path: '/vote/success', element: <VoteSuccessPage /> },
          { path: '/me', element: <MyInfoPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute role="admin" />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <AdminDashboardPage /> },
          { path: '/admin/groups', element: <Navigate to="/admin/groups/manage" replace /> },
          { path: '/admin/groups/create', element: <CreateGroupPage /> },
          { path: '/admin/groups/manage', element: <GroupsPage /> },
          { path: '/admin/players', element: <PlayersPage /> },
          { path: '/admin/sessions', element: <Navigate to="/admin/groups/manage" replace /> },
          { path: '/admin/results', element: <Navigate to="/admin/groups/manage" replace /> },
          { path: '/admin/results/comments', element: <Navigate to="/admin/groups/manage" replace /> },
          { path: '/admin/statistics', element: <Navigate to="/admin" replace /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/vote" replace /> },
]);

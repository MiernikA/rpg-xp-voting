import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types/api';

export function ProtectedRoute({ role }: { role?: Role }) {
  const { auth } = useAuth();
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  if (role && auth.user.role !== role) {
    return <Navigate to={auth.user.role === 'admin' ? '/admin' : '/vote'} replace />;
  }
  return <Outlet />;
}

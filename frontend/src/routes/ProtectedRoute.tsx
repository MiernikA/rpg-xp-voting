import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types/api';

export function ProtectedRoute({ role, roles }: { role?: Role; roles?: Role[] }) {
  const { auth } = useAuth();
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  const allowedRoles = roles ?? (role ? [role] : undefined);
  if (allowedRoles && !allowedRoles.includes(auth.user.role)) {
    return <Navigate to={auth.user.role === 'player' ? '/vote' : '/admin/groups/manage'} replace />;
  }
  return <Outlet />;
}

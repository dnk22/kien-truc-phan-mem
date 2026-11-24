import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '../types';
import { useAuthStore } from '../stores/auth.store';
import { roleHome } from '../utils/roles';
import { LoadingState } from '../../../shared/components/LoadingState';
export function PublicRoute() {
  const { user, restoring } = useAuthStore();
  if (restoring) return <LoadingState />;
  return user ? <Navigate to={roleHome[user.role]} replace /> : <Outlet />;
}
export function ProtectedRoute() {
  const { user, restoring } = useAuthStore();
  if (restoring) return <LoadingState />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
export function RoleGuard({ roles }: { roles: readonly Role[] }) {
  const user = useAuthStore((s) => s.user);
  return user && roles.includes(user.role) ? (
    <Outlet />
  ) : (
    <Navigate to="/unauthorized" replace />
  );
}
export function HomeRedirect() {
  const user = useAuthStore((s) => s.user);
  return <Navigate to={user ? roleHome[user.role] : '/login'} replace />;
}

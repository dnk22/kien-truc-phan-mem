import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import {
  HomeRedirect,
  ProtectedRoute,
  PublicRoute,
  RoleGuard,
} from '../features/auth/components/RouteGuards';
import { useRestoreSession } from '../features/auth/hooks/useAuth';
import { MainLayout } from './layout/MainLayout';
import { navigation } from './config/navigation';
import { LoadingState } from '../shared/components/LoadingState';
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const ProfilePage = lazy(() => import('../features/auth/pages/ProfilePage'));
const UsersPage = lazy(() => import('../features/users/pages/UsersPage'));
const UnavailablePage = lazy(() => import('./pages/UnavailablePage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const FoundationPage = lazy(() =>
  import('../features/foundation/pages/FoundationPage').then((m) => ({
    default: m.FoundationPage,
  })),
);
export function App() {
  useRestoreSession();
  return (
    <Suspense fallback={<LoadingState />}>
      <Routes>
        <Route path="/foundation" element={<FoundationPage />} />
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<HomeRedirect />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route element={<RoleGuard roles={['ADMIN']} />}>
              <Route path="/users" element={<UsersPage />} />
            </Route>
            {navigation
              .filter((item) => !item.available)
              .map((item) => (
                <Route
                  key={item.path}
                  element={<RoleGuard roles={item.roles} />}
                >
                  <Route path={item.path} element={<UnavailablePage />} />
                </Route>
              ))}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

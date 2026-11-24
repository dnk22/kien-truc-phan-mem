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
const CategoriesPage = lazy(() => import('../features/categories/pages/CategoriesPage'));
const ProductsPage = lazy(() => import('../features/products/pages/ProductsPage'));
const SuppliersPage = lazy(() => import('../features/suppliers/pages/SuppliersPage'));
const ReceiptsPage = lazy(() => import('../features/purchase-receipts/pages/ReceiptsPage'));
const InventoryPage = lazy(() => import('../features/inventory/pages/InventoryPage'));
const MovementsPage = lazy(() => import('../features/inventory/pages/MovementsPage'));
const AdjustmentsPage = lazy(() => import('../features/inventory/pages/AdjustmentsPage'));
const PosPage = lazy(() => import('../features/pos/pages/PosPage'));
const InvoicesPage = lazy(() => import('../features/sales/pages/InvoicesPage'));
const InvoiceDetailPage = lazy(() => import('../features/sales/pages/InvoiceDetailPage'));
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
            <Route element={<RoleGuard roles={['MANAGER']} />}>
              <Route path="/categories" element={<CategoriesPage />} />
            </Route>
            <Route element={<RoleGuard roles={['MANAGER','CASHIER','WAREHOUSE']} />}>
              <Route path="/products" element={<ProductsPage />} />
            </Route>
            <Route element={<RoleGuard roles={['MANAGER']} />}>
              <Route path="/suppliers" element={<SuppliersPage />} />
            </Route>
            <Route element={<RoleGuard roles={['MANAGER','WAREHOUSE']} />}>
              <Route path="/purchase-receipts" element={<ReceiptsPage />} />
              <Route path="/purchase-receipts/create" element={<ReceiptsPage />} />
              <Route path="/inventory/movements" element={<MovementsPage />} />
              <Route path="/inventory/adjustments" element={<AdjustmentsPage />} />
            </Route>
            <Route element={<RoleGuard roles={['MANAGER','WAREHOUSE','CASHIER']} />}>
              <Route path="/inventory" element={<InventoryPage />} />
            </Route>
            <Route element={<RoleGuard roles={['CASHIER']} />}>
              <Route path="/pos" element={<PosPage />} />
            </Route>
            <Route element={<RoleGuard roles={['MANAGER','CASHIER']} />}>
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
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

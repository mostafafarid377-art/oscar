import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/AppLayout';
import LandingPage from '@/pages/LandingPage';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';

// The marketing page ships in the initial bundle; every in-app screen is
// loaded on demand so the first paint stays light.
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const GaragePage = lazy(() => import('@/pages/GaragePage'));
const VehicleDetailsPage = lazy(() => import('@/pages/VehicleDetailsPage'));
const CarProofPage = lazy(() => import('@/pages/CarProofPage'));
const DocumentsPage = lazy(() => import('@/pages/DocumentsPage'));
const AiMechanicPage = lazy(() => import('@/pages/AiMechanicPage'));
const MaintenancePage = lazy(() => import('@/pages/MaintenancePage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!pathname.startsWith('/app')) window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

function PageFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-lime" aria-hidden="true" />
      <p className="text-xs text-text-secondary">{t('common.loading')}</p>
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="garage" element={<GaragePage />} />
            <Route path="garage/:vehicleId" element={<VehicleDetailsPage />} />
            <Route path="carproof" element={<CarProofPage />} />
            <Route path="carproof/:vehicleId" element={<CarProofPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="ai-mechanic" element={<AiMechanicPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

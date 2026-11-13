import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthProvider';
import { useApp } from '@/lib/store';

/**
 * Route guard for `/app/*`.
 *
 * Three distinct cases matter:
 *
 * 1. No Supabase credentials  → DEMO MODE. The prototype must stay explorable,
 *    so we let the user through exactly as in Phase 0.
 * 2. Credentials present, session still restoring → show a loading state
 *    instead of flashing the login screen.
 * 3. Credentials present, no session → redirect to /login, preserving the
 *    intended destination.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status, backendConnected } = useAuth();
  const { isAuthenticated: demoAuthenticated } = useApp();
  const location = useLocation();
  const { t } = useTranslation();

  if (!backendConnected) {
    return <>{children}</>;
  }

  if (status === 'initializing') {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink-950"
        role="status"
        aria-live="polite"
      >
        <span
          className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-lime"
          aria-hidden="true"
        />
        <p className="text-xs text-text-secondary">{t('auth.restoringSession')}</p>
      </div>
    );
  }

  // A signed-out visitor may still explore demo mode, but only if they came
  // through the demo entry point. Otherwise send them to log in.
  if (status === 'signed_out' && !demoAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

import { Navigate, Outlet } from 'react-router-dom';
import { PageLoader } from '@/components/ui/PageLoader';
import { useConfig } from '@/hooks/useConfig';
import { shouldOnboard } from '@/lib/onboarding';

/**
 * Route guard: first-run users (no search profile yet) are sent to the
 * onboarding wizard; everyone else passes through to the app shell. Fails
 * open if the backend is unreachable so the app can show its own errors.
 */
export default function OnboardingGate() {
  const { data, isLoading, isError } = useConfig();

  if (isLoading) return <PageLoader label="Loading your profile" />;
  if (isError || !data) return <Outlet />;
  if (shouldOnboard(data)) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

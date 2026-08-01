import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import OnboardingGate from '@/components/onboarding/OnboardingGate';
import OnboardingPage from '@/pages/OnboardingPage';
import ConfigPage from '@/pages/ConfigPage';
import DashboardPage from '@/pages/DashboardPage';
import ResumePage from '@/pages/ResumePage';
import JobsPage from '@/pages/JobsPage';
import JobNewPage from '@/pages/JobNewPage';
import JobDetailPage from '@/pages/JobDetailPage';
import CompaniesPage from '@/pages/CompaniesPage';
import OutreachPage from '@/pages/OutreachPage';
import ContactsPage from '@/pages/ContactsPage';
import LogsPage from '@/pages/LogsPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import NotFoundPage from '@/pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      {/* First-run wizard is full-screen, outside the app shell. */}
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* The app shell is gated: users without a search profile go through
          the onboarding wizard first. */}
      <Route element={<OnboardingGate />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/config" element={<ConfigPage />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/new" element={<JobNewPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/outreach" element={<OutreachPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

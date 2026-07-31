import { Route, Routes } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import ConfigPage from '@/pages/ConfigPage';
import DashboardPage from '@/pages/DashboardPage';
import ResumePage from '@/pages/ResumePage';
import JobsPage from '@/pages/JobsPage';
import JobDetailPage from '@/pages/JobDetailPage';
import CompaniesPage from '@/pages/CompaniesPage';
import OutreachPage from '@/pages/OutreachPage';
import ContactsPage from '@/pages/ContactsPage';
import LogsPage from '@/pages/LogsPage';
import ComingSoonPage from '@/pages/ComingSoonPage';
import NotFoundPage from '@/pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<ConfigPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/resume" element={<ResumePage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/new" element={<ComingSoonPage title="New Job" />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/outreach" element={<OutreachPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

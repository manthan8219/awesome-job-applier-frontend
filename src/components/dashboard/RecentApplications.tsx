import { Card } from '@/components/ui/Card';
import { SectionLabel } from './SectionLabel';
import { LiveStatusBadge } from './LiveStatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Clock } from 'lucide-react';
import type { DashRecent, EngineStatus } from '@/types';

export function RecentApplications({
  recent,
  lastJob,
  engineStatus,
}: {
  recent: DashRecent[];
  lastJob: string;
  engineStatus: EngineStatus;
}) {
  const running = engineStatus === 'running';
  return (
    <Card className="p-5">
      <SectionLabel>Recent</SectionLabel>
      <div className="mt-3 space-y-1.5">
        {!recent || recent.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No applications yet"
            description="Start a dry run to populate your application history."
            className="py-8"
          />
        ) : (
          (recent ?? []).map((r, i) => (
            <div
              key={`${r.label}-${r.status}-${i}`}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
            >
              <LiveStatusBadge status={r.status} />
              <span className="truncate text-sm text-slate-200">{r.label}</span>
            </div>
          ))
        )}
        {running && lastJob && (
          <p className="mt-2 flex items-center gap-2 border-t border-white/5 pt-2 text-sm">
            <span className="text-slate-500">Live:</span>
            <span className="truncate font-mono text-neon-cyan">{lastJob}</span>
          </p>
        )}
      </div>
    </Card>
  );
}

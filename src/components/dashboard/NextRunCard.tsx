import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/dashboard/SectionLabel';
import { nextRunAt } from '@/lib/schedule';

/** When the daily safe dry-run is next scheduled to fire. */
export function NextRunCard({
  enabled,
  at,
}: {
  enabled: boolean;
  at?: string;
}) {
  if (!enabled || !at) return null;
  const next = nextRunAt(at);
  const label = next.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className="p-4">
      <SectionLabel
        action={
          <Badge className="border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan">
            auto
          </Badge>
        }
      >
        Daily dry-run
      </SectionLabel>
      <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
        <CalendarClock className="h-4 w-4 shrink-0 text-neon-cyan" />
        Next run {label}
      </p>
      <p className="mt-1.5 text-xs text-slate-500">
        A safe dry-run — finds new jobs, submits nothing. Runs while the
        dashboard is open. Edit in{' '}
        <Link to="/config" className="text-neon-cyan hover:underline">
          Config
        </Link>
        .
      </p>
    </Card>
  );
}

import { memo } from 'react';
import { Ghost } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/dashboard/SectionLabel';
import { staleApplications } from '@/lib/applications';
import type { Application } from '@/types';

const STALE_DAYS = 14;

/**
 * Momentum nudge: applied jobs with no response for 14+ days are flagged so
 * the user can close them out (mark ghosted) instead of wondering.
 */
export const StaleNudge = memo(function StaleNudge({
  apps,
  onMarkGhosted,
}: {
  apps: Application[];
  onMarkGhosted: (ids: number[]) => void;
}) {
  const stale = staleApplications(apps, STALE_DAYS);
  if (stale.length === 0) return null;

  return (
    <Card className="border-neon-amber/20 p-4">
      <SectionLabel
        action={
          <Badge className="border-neon-amber/30 bg-neon-amber/10 text-neon-amber">
            {stale.length}
          </Badge>
        }
      >
        Silent applications
      </SectionLabel>
      <p className="mt-2 text-sm text-slate-400">
        {stale.length} application{stale.length === 1 ? '' : 's'} unanswered
        for over {STALE_DAYS} days.
      </p>
      <Button
        size="sm"
        variant="secondary"
        className="mt-3"
        leftIcon={<Ghost className="h-3.5 w-3.5" />}
        onClick={() => onMarkGhosted(stale.map((a) => a.id))}
      >
        Mark as ghosted
      </Button>
    </Card>
  );
});

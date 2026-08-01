import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SectionLabel } from './SectionLabel';
import { cn } from '@/lib/utils';
import type { ReadyCheck } from '@/types';

export function OnboardingCard({
  checks,
  onboardingComplete,
}: {
  checks: ReadyCheck[];
  onboardingComplete: boolean;
}) {
  const doneCount = (checks ?? []).filter((c) => c.ok).length;
  const pct = checks.length > 0 ? (doneCount / checks.length) * 100 : 0;

  return (
    <Card className="p-5">
      <SectionLabel
        action={
          onboardingComplete ? (
            <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-400">
              <Sparkles className="h-3 w-3" />
              Complete
            </Badge>
          ) : (
            <Badge className="border-neon-amber/30 bg-neon-amber/10 text-neon-amber">
              {doneCount}/{checks.length}
            </Badge>
          )
        }
      >
        Ready
      </SectionLabel>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-700">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-neon-cyan"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <ul className="mt-4 space-y-2.5">
        {(checks ?? []).map((c) => (
          <li key={c.key} className="flex items-start gap-2.5">
            {c.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-neon-amber" />
            )}
            <span
              className={cn(
                'text-sm',
                c.ok ? 'text-slate-100' : 'text-slate-500',
              )}
            >
              {c.ok ? c.label : c.hint}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[11px] text-slate-500">
        Get these green — every completed step lifts your reply rate.
      </p>
    </Card>
  );
}

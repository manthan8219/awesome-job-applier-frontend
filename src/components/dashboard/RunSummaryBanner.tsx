import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { MissionSnapshot } from '@/types';

/**
 * Shown after a dry run finishes: the "here's what we found" moment that
 * closes the onboarding loop without submitting anything.
 */
export function RunSummaryBanner({ snapshot }: { snapshot: MissionSnapshot }) {
  const [dismissed, setDismissed] = useState(false);
  const anythingApplied = snapshot.liveFeed.some((x) => x.status === 'applied');
  const show =
    !dismissed &&
    snapshot.engineStatus === 'done' &&
    snapshot.dryRun &&
    snapshot.foundCount > 0 &&
    !anythingApplied;

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
      <p className="min-w-0 flex-1 text-sm text-emerald-200">
        <span className="font-semibold">{snapshot.foundCount} jobs found</span>{' '}
        — 0 submitted (safe dry run).
      </p>
      <Link to="/jobs">
        <Button
          size="sm"
          variant="outline"
          leftIcon={<ArrowRight className="h-3.5 w-3.5" />}
        >
          Review &amp; apply
        </Button>
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="rounded-lg p-1 text-slate-500 transition-colors hover:text-slate-200"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Plus, SearchX, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useKeywordGap } from '@/hooks/useKeywordGap';
import { cn } from '@/lib/utils';

const chipCls =
  'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium';
const matchedCls = 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400';
const missingCls =
  'border-neon-amber/30 bg-neon-amber/10 text-neon-amber';

/**
 * Live keyword-gap panel (KAN-21): shows exactly which job-description keywords
 * the resume skill list already covers and which are missing — with a one-click
 * "add to skills" action and a link into the resume improve flow.
 */
export function KeywordGapPanel({
  description,
}: {
  description: string;
}) {
  const {
    matched,
    missing,
    matchedCount,
    missingCount,
    isLoading,
    isError,
    error,
    adding,
    addSkill,
  } = useKeywordGap(description);

  return (
    <Card className="space-y-3 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet/80">
          Keyword gap
        </h2>
        {!isLoading && !isError && (
          <p
            aria-live="polite"
            className="font-mono text-xs tabular-nums text-slate-500"
          >
            {matchedCount} matched · {missingCount} missing
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      ) : isError ? (
        <p className="text-sm text-red-400">
          Could not load resume skills:{' '}
          {error instanceof Error ? error.message : 'unknown error'}
        </p>
      ) : !description.trim() ? (
        <EmptyState
          icon={SearchX}
          title="No description to analyze"
          description="This job has no description text on file."
          className="py-8"
        />
      ) : matchedCount === 0 && missingCount === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Nothing to compare"
          description="Add resume skills to see what this job needs."
          className="py-8"
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {matched.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">
                Covered by your resume
              </p>
              <div className="flex flex-wrap gap-1.5">
                {matched.map((kw) => (
                  <span key={kw} className={cn(chipCls, matchedCls)}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {missing.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">
                Missing — add to skills in one click
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((kw) => (
                  <span key={kw} className={cn(chipCls, missingCls)}>
                    {kw}
                    <button
                      type="button"
                      aria-label={`Add ${kw} to skills`}
                      disabled={adding}
                      onClick={() => addSkill(kw)}
                      className="rounded p-0.5 text-neon-amber transition-colors hover:bg-white/10 disabled:opacity-50"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <FileText className="h-3.5 w-3.5" />
            <Link to="/resume" className="text-neon-cyan hover:underline">
              Improve your resume
            </Link>
            <span>· skills feed every tailored apply</span>
          </p>
        </motion.div>
      )}
    </Card>
  );
}

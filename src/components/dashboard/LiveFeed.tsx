import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from './SectionLabel';
import { LiveStatusBadge } from './LiveStatusBadge';
import { OrbitLoader } from '@/components/loaders';
import type { DashRecent, EngineStatus } from '@/types';

/**
 * Stable per-row keys: the first occurrence of a label+status pair is key #0,
 * the next #1, and so on. Prepending a new entry then does NOT change the keys
 * of existing rows, so they do not re-mount and re-run their entrance
 * animation on every mission poll (the source of the scroll jank).
 */
function stableKeys(feed: DashRecent[]): string[] {
  const seen = new Map<string, number>();
  return feed.map((r) => {
    const base = `${r.label}::${r.status}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return `${base}#${n}`;
  });
}

export const LiveFeed = memo(function LiveFeed({
  foundCount,
  liveFeed,
  engineStatus,
}: {
  foundCount: number;
  liveFeed: DashRecent[];
  engineStatus: EngineStatus;
}) {
  const running = engineStatus === 'running';
  const feed = liveFeed ?? [];
  const keys = useMemo(() => stableKeys(liveFeed ?? []), [liveFeed]);
  const rows = feed.slice(0, 10);

  return (
    <Card className="p-5">
      <SectionLabel
        action={
          foundCount > 0 || running ? (
            <span className="flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1 font-mono">
              <span className="text-lg font-bold leading-none text-emerald-400">
                {foundCount}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                found
              </span>
            </span>
          ) : undefined
        }
      >
        Live
      </SectionLabel>

      <div className="mt-3 min-h-[112px] space-y-2">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-slate-500">
            {running ? (
              <>
                <OrbitLoader size={36} />
                <p className="font-mono text-xs">
                  Searching… jobs appear here as providers return
                </p>
              </>
            ) : (
              <p className="text-sm">
                Start a run — finds stream here in real time
              </p>
            )}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {rows.map((r, i) => (
              <motion.div
                key={keys[i] ?? `${r.label}-${r.status}-${i}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex items-center gap-3"
              >
                <LiveStatusBadge status={r.status} />
                <span className="truncate text-sm text-slate-200">
                  {r.label}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        {feed.length > 10 && (
          <p className="pt-1 text-xs text-slate-500">+{feed.length - 10} more</p>
        )}
      </div>
    </Card>
  );
});


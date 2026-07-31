import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from './SectionLabel';
import { LiveStatusBadge } from './LiveStatusBadge';
import { OrbitLoader } from '@/components/loaders';
import type { DashRecent, EngineStatus } from '@/types';

export function LiveFeed({
  foundCount,
  liveFeed,
  engineStatus,
}: {
  foundCount: number;
  liveFeed: DashRecent[];
  engineStatus: EngineStatus;
}) {
  const running = engineStatus === 'running';
  return (
    <Card className="p-5">
      <SectionLabel
        action={
          foundCount > 0 ? (
            <span className="font-mono text-[11px] text-emerald-400">
              {foundCount} discovered
            </span>
          ) : undefined
        }
      >
        Live
      </SectionLabel>

      <div className="mt-3 min-h-[112px] space-y-2">
        {liveFeed.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-slate-500">
            {running ? (
              <>
                <OrbitLoader size={36} />
                <p className="font-mono text-xs">Searching… jobs appear here as providers return</p>
              </>
            ) : (
              <p className="text-sm">Start a run — finds stream here in real time</p>
            )}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {liveFeed.slice(0, 10).map((r, i) => (
              <motion.div
                key={`${r.label}-${r.status}-${i}`}
                layout
                initial={{ opacity: 0, x: -6, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex items-center gap-3"
              >
                <LiveStatusBadge status={r.status} />
                <span className="truncate text-sm text-slate-200">{r.label}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        {liveFeed.length > 10 && (
          <p className="pt-1 text-xs text-slate-500">+{liveFeed.length - 10} more</p>
        )}
      </div>
    </Card>
  );
}

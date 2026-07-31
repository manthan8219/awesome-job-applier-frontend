import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { EngineStatus } from '@/types';

const META: Record<
  EngineStatus,
  { dot: string; label: string; ring: string }
> = {
  idle: { dot: 'bg-slate-500', label: 'Idle', ring: 'text-slate-400' },
  running: {
    dot: 'bg-emerald-400',
    label: 'Running',
    ring: 'text-emerald-400',
  },
  done: { dot: 'bg-neon-violet', label: 'Done', ring: 'text-neon-violet' },
  error: { dot: 'bg-red-400', label: 'Error', ring: 'text-red-400' },
  stopped: { dot: 'bg-slate-500', label: 'Stopped', ring: 'text-slate-400' },
};

export function EngineStatusDot({
  status,
  className,
}: {
  status: EngineStatus;
  className?: string;
}) {
  const meta = META[status];
  const live = status === 'running';
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <motion.span
        className={cn('h-2 w-2 rounded-full', meta.dot)}
        animate={live ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } : {}}
        transition={
          live ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : {}
        }
      />
      <span className={cn('text-xs font-medium', meta.ring)}>{meta.label}</span>
    </span>
  );
}

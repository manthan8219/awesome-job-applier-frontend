import { type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Accent = 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose';

const accents: Record<Accent, string> = {
  cyan: 'text-neon-cyan shadow-glow-soft',
  violet: 'text-neon-violet',
  emerald: 'text-emerald-400',
  amber: 'text-neon-amber',
  rose: 'text-red-400',
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: Accent;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'cyan',
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('glass relative overflow-hidden p-5', className)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-slate-50">
            {value}
          </p>
        </div>
        <span
          className={cn(
            'grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-ink-800/60',
            accents[accent],
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-neon-cyan/10 blur-2xl" />
    </motion.div>
  );
}

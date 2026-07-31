import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TerminalLoaderProps {
  className?: string;
  label?: string;
}

/** A blinking terminal cursor — on-brand for a job-runner UI. */
export default function TerminalLoader({
  className,
  label = 'executing',
}: TerminalLoaderProps) {
  return (
    <div
      className={cn('flex items-center gap-2 font-mono text-sm text-neon-cyan', className)}
      role="status"
      aria-label="Loading"
    >
      <span className="text-slate-500">$</span>
      <motion.span
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {label}
      </motion.span>
      <motion.span
        className="inline-block h-4 w-2 bg-neon-cyan"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'steps(2)' }}
      />
    </div>
  );
}

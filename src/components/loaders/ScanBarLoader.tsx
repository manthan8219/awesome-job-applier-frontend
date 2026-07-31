import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ScanBarLoaderProps {
  className?: string;
}

/** A light bar scanning across a track — sleek progress feel. */
export default function ScanBarLoader({ className }: ScanBarLoaderProps) {
  return (
    <div
      className={cn(
        'relative h-1.5 w-44 overflow-hidden rounded-full bg-ink-700',
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      <motion.span
        className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-neon-cyan to-transparent"
        animate={{ x: ['-33%', '300%'] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

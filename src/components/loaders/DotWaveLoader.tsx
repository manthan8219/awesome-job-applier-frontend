import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DotWaveLoaderProps {
  className?: string;
  count?: number;
}

/** Five neon dots bouncing in a wave with staggered easing. */
export default function DotWaveLoader({
  className,
  count = 5,
}: DotWaveLoaderProps) {
  const dots = Array.from({ length: count }, (_, i) => i);
  return (
    <div
      className={cn('flex items-end gap-1.5', className)}
      role="status"
      aria-label="Loading"
    >
      {dots.map((i) => (
        <motion.span
          key={i}
          className="h-2.5 w-2.5 rounded-full bg-gradient-to-b from-neon-cyan to-neon-violet"
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

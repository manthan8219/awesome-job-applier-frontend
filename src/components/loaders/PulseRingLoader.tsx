import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PulseRingLoaderProps {
  className?: string;
  size?: number;
}

/** Expanding ripple rings — a calm, futuristic "thinking" indicator. */
export default function PulseRingLoader({
  className,
  size = 56,
}: PulseRingLoaderProps) {
  const rings = [0, 1, 2];
  return (
    <div
      className={cn('relative grid place-items-center', className)}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      {rings.map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border border-neon-cyan"
          style={{ width: size, height: size }}
          animate={{ scale: [0.4, 1.4], opacity: [0.8, 0] }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeOut',
            delay: i * 0.7,
          }}
        />
      ))}
      <span className="h-2.5 w-2.5 rounded-full bg-neon-cyan shadow-glow-cyan" />
    </div>
  );
}

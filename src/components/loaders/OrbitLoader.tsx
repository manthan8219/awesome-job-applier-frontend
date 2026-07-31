import { cn } from '@/lib/utils';

interface OrbitLoaderProps {
  className?: string;
  size?: number;
}

/**
 * Concentric neon rings rotating in opposite directions around a pulsing core.
 * Pure CSS rotation (transform-origin center on block elements) — buttery smooth.
 */
export default function OrbitLoader({ className, size = 56 }: OrbitLoaderProps) {
  return (
    <div
      className={cn('relative', className)}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      <div className="absolute inset-0 rounded-full border border-neon-cyan/15" />
      <div
        className="absolute inset-0 animate-spin-slow rounded-full border-2 border-transparent"
        style={{
          borderTopColor: '#22d3ee',
          borderRightColor: 'rgba(34,211,238,0.3)',
        }}
      />
      <div
        className="absolute inset-[22%] animate-spin-rev rounded-full border-2 border-transparent"
        style={{
          borderBottomColor: '#a855f7',
          borderLeftColor: 'rgba(168,85,247,0.3)',
        }}
      />
      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 animate-pulse-glow rounded-full bg-neon-cyan shadow-glow-cyan" />
    </div>
  );
}

import { Badge } from './Badge';
import { cn } from '@/lib/utils';

/**
 * A dot + label status pill. Accepts the literal Tailwind class strings from
 * the *_META constant maps so Tailwind's JIT sees them at build time.
 */
export function DotBadge({
  dot,
  label,
  badge,
  className,
}: {
  dot: string;
  label: string;
  badge: string;
  className?: string;
}) {
  return (
    <Badge className={cn(badge, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {label}
    </Badge>
  );
}

import { Badge } from '@/components/ui/Badge';
import { LIVE_META } from '@/constants';
import { cn } from '@/lib/utils';
import type { LiveStatus } from '@/types';

export function LiveStatusBadge({
  status,
  className,
}: {
  status: LiveStatus;
  className?: string;
}) {
  const meta = LIVE_META[status];
  return (
    <Badge className={cn(meta.badge, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </Badge>
  );
}

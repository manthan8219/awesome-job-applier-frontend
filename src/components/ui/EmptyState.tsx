import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16 text-center',
        className,
      )}
    >
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-ink-800/60 text-neon-cyan">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-display text-lg text-slate-100">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-slate-400">{description}</p>
      )}
      {action}
    </div>
  );
}

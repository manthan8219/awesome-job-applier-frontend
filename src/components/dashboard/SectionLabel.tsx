import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** A small uppercase section chip mirroring the TUI labelStyle. */
export function SectionLabel({
  children,
  className,
  action,
}: {
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet/80">
        {children}
      </span>
      {action}
    </div>
  );
}

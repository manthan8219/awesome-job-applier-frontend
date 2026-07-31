import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Small uppercase mono section chip mirroring the TUI labelStyle and the
 * dashboard SectionLabel. Shared across the resume tabs.
 */
export function SectionHeading({
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
      <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet/80">
        {children}
      </h3>
      {action}
    </div>
  );
}

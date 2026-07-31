import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function Card({ className, glow = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn('glass shadow-panel', glow && 'shadow-glow-soft', className)}
      {...props}
    >
      {children}
    </div>
  );
}

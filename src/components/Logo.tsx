import { Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl border border-neon-cyan/40 bg-ink-800/60 shadow-glow-soft">
        <Terminal className="h-4 w-4 text-neon-cyan" />
      </span>
      <span className="font-display text-base font-semibold tracking-tight">
        <span className="neon-text">terminal</span>
        <span className="text-slate-200">·job</span>
      </span>
    </div>
  );
}

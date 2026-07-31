import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from './SectionLabel';
import { DotWaveLoader } from '@/components/loaders';
import { cn } from '@/lib/utils';
import type { EngineStatus, ProviderStatus } from '@/types';

const statusIcon: Record<
  ProviderStatus,
  { glyph: string; cls: string; pulse?: boolean }
> = {
  searching: { glyph: '●', cls: 'text-neon-cyan', pulse: true },
  done: { glyph: '✓', cls: 'text-emerald-400' },
  error: { glyph: '✗', cls: 'text-red-400' },
  idle: { glyph: '○', cls: 'text-slate-600' },
};

export function ProvidersGrid({
  providers,
  progress,
  engineStatus,
}: {
  providers: string[];
  progress: Record<string, ProviderStatus>;
  engineStatus: EngineStatus;
}) {
  return (
    <Card className="p-5">
      <SectionLabel
        action={
          engineStatus === 'running' ? (
            <span className="flex items-center gap-2 font-mono text-[11px] text-neon-cyan">
              <DotWaveLoader count={3} className="py-0.5" />
              scraping
            </span>
          ) : undefined
        }
      >
        Providers
      </SectionLabel>

      {providers.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">none configured</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {providers.map((name, i) => {
            const st = progress[name] ?? 'idle';
            const meta = statusIcon[st];
            return (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={cn(
                  'flex items-center gap-2 rounded-lg border border-white/5 bg-ink-800/50 px-3 py-2',
                  st === 'searching' && 'border-neon-cyan/30 shadow-glow-soft',
                )}
              >
                {meta.pulse ? (
                  <motion.span
                    className={cn('text-sm', meta.cls)}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {meta.glyph}
                  </motion.span>
                ) : (
                  <span className={cn('text-sm', meta.cls)}>{meta.glyph}</span>
                )}
                <span className="truncate font-mono text-xs text-slate-300">
                  {name}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

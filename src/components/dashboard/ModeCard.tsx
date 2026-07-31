import { Play, Square } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SectionLabel } from './SectionLabel';
import { EngineStatusDot } from './EngineStatusDot';
import { cn } from '@/lib/utils';
import type { EngineStatus } from '@/types';

interface PillProps {
  label: string;
  value: string;
  tone: 'on' | 'off' | 'warn';
  onToggle?: () => void;
  toggleable?: boolean;
}

const toneCls: Record<PillProps['tone'], string> = {
  on: 'text-emerald-400',
  off: 'text-red-400',
  warn: 'text-neon-amber',
};

function Pill({ label, value, tone, onToggle, toggleable }: PillProps) {
  const body = (
    <span className="flex items-center gap-1.5 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={cn('font-bold', toneCls[tone])}>{value}</span>
    </span>
  );
  if (!toggleable) return body;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-lg border border-white/5 bg-ink-800/60 px-2.5 py-1 transition-colors hover:border-neon-cyan/30 hover:bg-ink-700/60"
    >
      {body}
    </button>
  );
}

export function ModeCard({
  engineStatus,
  modeName,
  modeHint,
  dryRun,
  autoApply,
  hasConsent,
  errMsg,
  startPending,
  onToggleDryRun,
  onToggleAutoApply,
  onStart,
  onStop,
}: {
  engineStatus: EngineStatus;
  modeName: string;
  modeHint: string;
  dryRun: boolean;
  autoApply: boolean;
  hasConsent: boolean;
  errMsg: string;
  startPending: boolean;
  onToggleDryRun: () => void;
  onToggleAutoApply: () => void;
  onStart: () => void;
  onStop: () => void;
}) {
  const running = engineStatus === 'running';
  return (
    <Card className="p-5">
      <SectionLabel action={<EngineStatusDot status={engineStatus} />}>
        Mode
      </SectionLabel>

      <p className="mt-3 font-display text-lg font-semibold text-emerald-400">
        {modeName}
      </p>
      <p className="mt-0.5 text-sm text-slate-400">{modeHint}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Pill
          label="Dry run"
          value={dryRun ? 'ON' : 'OFF'}
          tone={dryRun ? 'on' : 'off'}
          toggleable={!running}
          onToggle={onToggleDryRun}
        />
        <Pill
          label="Auto apply"
          value={autoApply && hasConsent ? 'ARMED' : 'PAUSED'}
          tone={autoApply && hasConsent ? 'on' : 'off'}
          toggleable={!running}
          onToggle={onToggleAutoApply}
        />
        <Pill
          label="Consent"
          value={hasConsent ? 'OK' : 'REQUIRED'}
          tone={hasConsent ? 'on' : 'warn'}
        />
      </div>

      <div className="mt-5">
        {running ? (
          <Button
            variant="danger"
            className="w-full"
            leftIcon={<Square className="h-4 w-4" />}
            onClick={onStop}
          >
            Stop engine
          </Button>
        ) : (
          <Button
            className="w-full"
            loading={startPending}
            leftIcon={<Play className="h-4 w-4" />}
            onClick={onStart}
          >
            {dryRun ? 'Start dry run' : autoApply && hasConsent ? 'Start auto apply' : 'Start search'}
          </Button>
        )}
      </div>

      {errMsg && (
        <p className="mt-3 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-300">
          {errMsg}
        </p>
      )}
    </Card>
  );
}

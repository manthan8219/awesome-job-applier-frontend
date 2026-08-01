import { type FormEvent } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const inputCls =
  'w-full rounded-xl border border-white/5 bg-ink-950/60 px-4 py-3 text-base text-slate-100 placeholder:text-slate-600 transition-colors focus:border-neon-cyan/40 focus:outline-none';

interface WelcomeStepProps {
  intent: string;
  onIntentChange: (value: string) => void;
  onGenerate: () => void;
  onExplore: () => void;
  /** Live suggestions that appear as the user types. */
  liveTitles: string[];
  aiEnabled: boolean;
  aiOff: boolean;
  onEnableAI: () => void;
  enablingAI: boolean;
  error?: string | null;
}

/** Step 1: one free-text input — "what job do you want?" with live AI chips. */
export function WelcomeStep({
  intent,
  onIntentChange,
  onGenerate,
  onExplore,
  liveTitles,
  aiEnabled,
  aiOff,
  onEnableAI,
  enablingAI,
  error,
}: WelcomeStepProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onGenerate();
  }

  const typing = intent.trim() !== '';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-semibold text-slate-50">
          Let&apos;s find your next job
        </h1>
        <p className="text-sm text-slate-400">
          Describe the job you want in plain words — suggestions appear as you
          type, then become search titles you can edit. We prioritize targeted,
          recent postings: quality beats volume.
        </p>
      </div>

      <input
        autoFocus
        type="text"
        value={intent}
        onChange={(e) => onIntentChange(e.target.value)}
        placeholder="e.g. Senior Go Engineer, remote, $120k+"
        className={inputCls}
        aria-label="What job do you want?"
      />

      {typing && liveTitles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {liveTitles.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-lg border border-neon-violet/20 bg-neon-violet/10 px-2 py-0.5 text-xs font-medium text-neon-violet"
            >
              <Sparkles className="h-3 w-3" />
              {t}
            </span>
          ))}
        </div>
      )}
      {aiOff && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neon-amber/20 bg-neon-amber/5 px-3 py-2">
          <p className="flex-1 text-xs text-slate-400">
            {aiEnabled
              ? 'AI is unreachable right now — title suggestions are unavailable.'
              : 'AI Assist is off — title suggestions are unavailable.'}
          </p>
          {!aiEnabled && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              loading={enablingAI}
              onClick={onEnableAI}
            >
              Enable AI Assist
            </Button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          size="lg"
          className="flex-1"
          disabled={!intent.trim()}
          leftIcon={<Sparkles className="h-4 w-4" />}
        >
          Find my roles
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onExplore}
          className="flex-1"
        >
          Just exploring — search with defaults
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Rocket,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface AiStepProps {
  /** Whether AI Assist is currently enabled in the config. */
  aiEnabled: boolean;
  aiProvider: string;
  localLLMModel?: string;
  /** Local-LLM connectivity from the backend (null = not checked yet). */
  llmStatus: { reachable: boolean; installed: string[] } | null;
  enablingAI: boolean;
  onEnableAI: () => void;
  onStartSearch: () => void;
  onSkip: () => void;
  saving: boolean;
  error?: string | null;
}

const BENEFITS = [
  {
    icon: Sparkles,
    title: 'Fit-score every job against your resume',
    body: 'Rank the jobs most likely to reply before you spend a second on them.',
  },
  {
    icon: Brain,
    title: 'Full resume analysis & improvement',
    body: 'Extract skills and a career profile from your resume, then improve it.',
  },
  {
    icon: CheckCircle2,
    title: 'Sharper titles & tailoring',
    body: 'Turn one aspiration sentence into target titles and tailor each application.',
  },
  {
    icon: ArrowRight,
    title: 'Draft answers & cover letters',
    body: 'AI drafts tailored answers you still review right before anything is sent.',
  },
] as const;

function statusText(props: AiStepProps): {
  tone: 'off' | 'on' | 'warn';
  text: string;
} {
  const { aiEnabled, aiProvider, localLLMModel, llmStatus } = props;
  if (!aiEnabled) return { tone: 'off', text: 'AI Assist is off' };
  if (aiProvider === 'api') return { tone: 'on', text: 'API key connected' };
  if (aiProvider === 'local') {
    if (llmStatus?.reachable) {
      if (llmStatus.installed.length > 0) {
        return {
          tone: 'on',
          text: `Local AI ready · ${localLLMModel ?? 'model set'}`,
        };
      }
      return {
        tone: 'warn',
        text: 'AI is on, but no model is installed — install one in Config before fit-scoring works.',
      };
    }
    return {
      tone: 'warn',
      text: 'AI is on, but the local LLM is not reachable — is Ollama running?',
    };
  }
  return { tone: 'on', text: 'AI Assist is on' };
}

const toneCls = {
  off: 'border-white/10 bg-ink-800/40 text-slate-400',
  on: 'border-emerald-400/25 bg-emerald-400/5 text-emerald-400',
  warn: 'border-neon-amber/25 bg-neon-amber/5 text-neon-amber',
} as const;

/** Step 3: a short, skippable ask for AI Assist before the first dry run. */
export function AiStep(props: AiStepProps) {
  const { enablingAI, onEnableAI, onStartSearch, onSkip, saving, error } = props;
  const status = statusText(props);

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-semibold text-slate-50">
          Boost your results with AI Assist
        </h1>
        <p className="text-sm text-slate-400">
          Optional, but recommended — it is the difference between “find jobs”
          and “find jobs you are most likely to get”. Everything stays on this
          machine when you use the local model.
        </p>
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2">
        {BENEFITS.map((b) => (
          <li
            key={b.title}
            className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-ink-950/40 px-3 py-2.5"
          >
            <b.icon className="mt-0.5 h-4 w-4 shrink-0 text-neon-cyan" />
            <div>
              <p className="text-sm font-medium text-slate-200">{b.title}</p>
              <p className="text-xs text-slate-500">{b.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border px-3.5 py-2.5',
          toneCls[status.tone],
        )}
      >
        {status.tone === 'off' ? (
          <WifiOff className="h-4 w-4 shrink-0" />
        ) : (
          <Wifi className="h-4 w-4 shrink-0" />
        )}
        <span className="text-sm">{status.text}</span>
      </div>

      {!props.aiEnabled && (
        <Button
          type="button"
          variant="outline"
          loading={enablingAI}
          onClick={onEnableAI}
          leftIcon={<Brain className="h-4 w-4" />}
        >
          Turn on AI Assist
        </Button>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          size="lg"
          className="flex-1"
          loading={saving}
          onClick={onStartSearch}
          leftIcon={<Rocket className="h-4 w-4" />}
        >
          Start my first search — safe dry run
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onSkip}
          className="flex-1"
        >
          Skip — go to the dashboard
        </Button>
      </div>

      <p className="text-center font-mono text-[11px] text-slate-500">
        You can enable AI Assist anytime in Config. First run is a dry run —
        nothing is submitted.
      </p>
    </div>
  );
}

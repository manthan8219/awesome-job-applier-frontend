import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Loader2,
  Save,
  Sparkles,
  Wifi,
  WifiOff,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/PageLoader';
import { NotifySettings } from '@/components/config/NotifySettings';
import { ResumeUpload } from '@/components/config/ResumeUpload';
import { TagInput } from '@/components/config/TagInput';
import { api } from '@/lib/api';
import { backfilledLabels, contactPatch } from '@/lib/resume-backfill';
import { useConfig } from '@/hooks/useConfig';
import { useUpdateConfig } from '@/hooks/useUpdateConfig';
import { cn } from '@/lib/utils';
import type { NexusConfig } from '@/types';

/* -------------------------------------------------------------------------- */
/*  Section header                                                            */
/* -------------------------------------------------------------------------- */
function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet/80">
      {children}
    </h2>
  );
}

/* -------------------------------------------------------------------------- */
/*  Field helpers                                                             */
/* -------------------------------------------------------------------------- */
const inputCls =
  'w-full rounded-xl border border-white/5 bg-ink-950/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 transition-colors focus:border-neon-cyan/40 focus:outline-none';

function TextField({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn('space-y-1', className)}>
      <label
        htmlFor={id}
        className="block text-xs font-medium uppercase tracking-wider text-slate-500"
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn('space-y-1', className)}>
      <label
        htmlFor={id}
        className="block text-xs font-medium uppercase tracking-wider text-slate-500"
      >
        {label}
      </label>
      <input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        className={inputCls}
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn('space-y-1', className)}>
      <label
        htmlFor={id}
        className="block text-xs font-medium uppercase tracking-wider text-slate-500"
      >
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(inputCls, 'h-auto resize-y')}
      />
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          value ? 'bg-neon-cyan/30' : 'bg-ink-700',
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 h-6 w-6 rounded-full transition-all',
            value
              ? 'translate-x-5 bg-neon-cyan shadow-glow-cyan'
              : 'translate-x-0 bg-slate-500',
          )}
        />
      </button>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <div
        role="group"
        aria-label={label}
        className="flex flex-wrap gap-1.5"
      >
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            aria-pressed={value === opt}
            onClick={() => onChange(opt)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs capitalize transition-all',
              value === opt
                ? 'bg-neon-cyan/15 text-neon-cyan'
                : 'bg-ink-800/60 text-slate-400 hover:text-slate-200',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*  Local LLM Model Picker — live from API                                    */
/* -------------------------------------------------------------------------- */
function ModelPicker({
  value,
  onChange,
  llmStatus,
  llmLoading,
  pullingModel,
  pullProgress,
  onDownloadModel,
}: {
  value: string;
  onChange: (v: string) => void;
  llmStatus: {
    reachable: boolean;
    installed: string[];
    models: Array<{
      name: string;
      displayName: string;
      minRamGb: number;
      fits: boolean;
      installed: boolean;
    }>;
    machine?: { ramGb: number; cpu: string };
    err?: string;
  } | null;
  llmLoading: boolean;
  pullingModel: string | null;
  pullProgress: {
    status: string;
    message?: string;
    completed?: number;
    total?: number;
    error?: string;
  } | null;
  onDownloadModel: (model: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
        Local Model
      </label>
      {/* Connection status */}
      {llmLoading ? (
        <div className="flex items-center gap-2 rounded-xl bg-ink-800/60 px-3 py-2 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Detecting local LLM runtime...
        </div>
      ) : llmStatus === null ? (
        <div className="flex items-center gap-2 rounded-xl bg-ink-800/60 px-3 py-2 text-xs text-slate-500">
          <WifiOff className="h-3.5 w-3.5 text-slate-600" />
          Not checked — enable AI Assist and select Local LLM
        </div>
      ) : llmStatus.reachable ? (
        <>
          <div className="flex items-center gap-2 rounded-xl bg-emerald-400/5 px-3 py-2 text-xs text-emerald-400">
            <Wifi className="h-3.5 w-3.5" />
            Ollama connected · {llmStatus.machine?.cpu ?? 'Unknown'} ·{' '}
            {llmStatus.machine?.ramGb ?? '?'}GB RAM
          </div>
          {llmStatus.installed.length > 0 && (
            <div className="text-xs text-slate-500">
              Installed:{' '}
              {llmStatus.installed.map((m) => m.split(':')[0]).join(', ')}
            </div>
          )}
          <div className="grid grid-cols-2 gap-1.5">
            {llmStatus.models
              .filter((m) => m.fits)
              .map((m) => (
                <div key={m.name} className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => onChange(m.name)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-all',
                      value === m.name
                        ? 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan'
                        : 'border-white/5 bg-ink-800/60 text-slate-400 hover:border-white/10 hover:text-slate-200',
                    )}
                  >
                    <span className="flex-1 truncate">{m.displayName}</span>
                    {m.installed && (
                      <span className="shrink-0 text-emerald-400">
                        installed
                      </span>
                    )}
                    <span className="shrink-0 text-slate-600">
                      {m.minRamGb}GB
                    </span>
                  </button>
                  {!m.installed && pullingModel !== m.name && (
                    <button
                      type="button"
                      onClick={() => onDownloadModel(m.name)}
                      className="self-start rounded-md border border-neon-cyan/20 bg-neon-cyan/5 px-2 py-0.5 text-[10px] text-neon-cyan transition-colors hover:bg-neon-cyan/10"
                    >
                      Download
                    </button>
                  )}
                  {pullingModel === m.name && pullProgress && (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="truncate">
                          {pullProgress.message || pullProgress.status}
                        </span>
                      </div>
                      {pullProgress.total && pullProgress.total > 0 && (
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                          <div
                            className="h-full rounded-full bg-neon-cyan transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.round(((pullProgress.completed ?? 0) * 100) / pullProgress.total))}%`,
                            }}
                          />
                        </div>
                      )}
                      {pullProgress.total && pullProgress.total > 0 && (
                        <span className="text-[10px] text-slate-600">
                          {formatBytes(pullProgress.completed ?? 0)} /{' '}
                          {formatBytes(pullProgress.total)}
                        </span>
                      )}
                      {pullProgress.status === 'error' && (
                        <span className="text-[10px] text-red-400">
                          {pullProgress.error || pullProgress.message}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-ink-800/60 px-3 py-2 text-xs text-slate-500">
          <WifiOff className="h-3.5 w-3.5 text-slate-600" />
          Ollama not reachable at {llmStatus.err ?? 'unknown URL'}
        </div>
      )}
      <TextField
        label="Custom model name"
        value={value}
        onChange={onChange}
        placeholder="llama3.2:latest"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  MissingFields (mirrors TUI form_complete.go)                              */
/* -------------------------------------------------------------------------- */
function computeMissing(f: Partial<NexusConfig>): string[] {
  const miss: string[] = [];
  if (!f.firstName?.trim()) miss.push('First Name');
  if (!f.lastName?.trim()) miss.push('Last Name');
  if (!f.email?.trim()) miss.push('Email');
  if (!f.phone?.trim()) miss.push('Phone');
  if (!f.linkedinId?.trim()) miss.push('LinkedIn ID');
  if (!f.resumePath?.trim()) miss.push('Resume');
  if (!f.targetJobTitles?.trim() && !f.jobIntent?.trim())
    miss.push('Target Job Titles');
  if (!f.targetLocations?.trim()) miss.push('Target Locations');
  return miss;
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */
export default function ConfigPage() {
  const { data: loaded, isLoading } = useConfig();
  const update = useUpdateConfig();
  const runTimeId = useId();

  const [f, setF] = useState<Partial<NexusConfig>>({});
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const locTimer = useRef<ReturnType<typeof setTimeout>>();
  const fileTimer = useRef<ReturnType<typeof setTimeout>>();

  // Location autocomplete
  const [locSuggestions, setLocSuggestions] = useState<string[]>([]);

  // File path autocomplete
  const [fileSuggestions, setFileSuggestions] = useState<string[]>([]);

  // Job title AI suggestions
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [suggestHint, setSuggestHint] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);

  // LLM status
  const [llmStatus, setLlmStatus] = useState<{
    reachable: boolean;
    installed: string[];
    models: Array<{
      name: string;
      displayName: string;
      minRamGb: number;
      fits: boolean;
      installed: boolean;
    }>;
    machine?: { ramGb: number; cpu: string };
    err?: string;
  } | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);

  // Resume analysis
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisMsg, setAnalysisMsg] = useState<string | null>(null);
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null);
  const lastBackfillPath = useRef('');

  // Model download state
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState<{
    status: string;
    message?: string;
    completed?: number;
    total?: number;
    error?: string;
  } | null>(null);
  const pullTimer = useRef<ReturnType<typeof setTimeout>>();

  async function handleDownloadModel(model: string) {
    setPullingModel(model);
    setPullProgress({ status: 'starting', message: 'Starting download...' });
    try {
      await api.pullLLMModel(model);
      pollPullStatus(model);
    } catch {
      setPullProgress({ status: 'error', message: 'Failed to start download' });
      setPullingModel(null);
    }
  }

  async function pollPullStatus(model: string) {
    try {
      const status = await api.getLLMPullStatus(model);
      setPullProgress(status);
      if (status.status === 'complete' || status.status === 'error') {
        setPullingModel(null);
        if (status.status === 'complete') {
          api
            .getLLMStatus()
            .then(setLlmStatus)
            .catch(() => {});
        }
        return;
      }
      pullTimer.current = setTimeout(() => pollPullStatus(model), 2000);
    } catch {
      setPullingModel(null);
    }
  }

  // Load LLM status on mount
  useEffect(() => {
    if (!f.aiAssist) return;
    setLlmLoading(true);
    api
      .getLLMStatus()
      .then(setLlmStatus)
      .catch(() =>
        setLlmStatus({
          reachable: false,
          installed: [],
          models: [],
          err: 'Failed to connect',
        }),
      )
      .finally(() => setLlmLoading(false));
  }, [f.aiAssist, f.aiProvider, f.localLLMURL]);

  useEffect(() => {
    if (loaded) {
      setF(loaded);
      setSaved(false);
    }
  }, [loaded]);

  const missing = useMemo(() => computeMissing(f), [f]);

  function patch(part: Partial<NexusConfig>) {
    setF((prev) => ({ ...prev, ...part }));
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setF((current) => {
        update.mutate(current as NexusConfig, {
          onSuccess: () => setSaved(true),
        });
        return current;
      });
    }, 500);
  }

  // Location search: debounced geo autocomplete
  const handleLocationInput = useCallback((value: string) => {
    if (locTimer.current) clearTimeout(locTimer.current);
    if (value.length < 2) {
      setLocSuggestions([]);
      return;
    }
    locTimer.current = setTimeout(async () => {
      try {
        const results = await api.geoSearch(value);
        setLocSuggestions(results.map((r) => r.label));
      } catch {
        setLocSuggestions([]);
      }
    }, 300);
  }, []);

  // File path autocomplete: debounced filesystem lookup
  const handleFileInput = useCallback((value: string) => {
    if (fileTimer.current) clearTimeout(fileTimer.current);
    if (value.length < 2) {
      setFileSuggestions([]);
      return;
    }
    fileTimer.current = setTimeout(async () => {
      try {
        const results = await api.getFSAutocomplete(value);
        setFileSuggestions(results);
      } catch {
        setFileSuggestions([]);
      }
    }, 300);
  }, []);

  // Job title AI suggestions (error hint when the service is unreachable)
  async function handleSuggestTitles() {
    const intent = f.jobIntent?.trim();
    if (!intent) return;
    setSuggesting(true);
    setTitleSuggestions([]);
    setSuggestHint(null);
    try {
      const result = await api.suggestJobTitles(intent, f.yearsOfExperience);
      setTitleSuggestions(result.titles);
    } catch {
      setTitleSuggestions([]);
      setSuggestHint(
        'Could not reach the AI title service. Enable AI Assist in AI Configuration, or enter titles manually.',
      );
    }
    setSuggesting(false);
  }

  // Resume analysis + profile backfill
  async function handleAnalyzeResume() {
    const path = f.resumePath?.trim();
    if (!path) return;
    setAnalyzing(true);
    setAnalysisMsg(null);
    try {
      const result = await api.reanalyzeResume(path);
      if (result.valid) {
        setAnalysisMsg(result.message || 'Resume is valid');
        const backfill = contactPatch(f, result.contact);
        if (Object.keys(backfill).length > 0) {
          patch(backfill);
          setBackfillMsg(
            `Backfilled from resume: ${backfilledLabels(backfill).join(', ')}`,
          );
        }
      } else {
        setAnalysisMsg(result.err || 'Analysis failed');
      }
    } catch {
      setAnalysisMsg('Analysis failed');
    }
    setAnalyzing(false);
    lastBackfillPath.current = path;
  }

  // Auto-analyze a newly set resume path once, then backfill the profile.
  const analyzeRef = useRef<() => Promise<void>>(async () => undefined);
  analyzeRef.current = handleAnalyzeResume;
  useEffect(() => {
    const path = f.resumePath?.trim();
    if (!path || path === lastBackfillPath.current) return;
    const id = window.setTimeout(() => {
      void analyzeRef.current();
    }, 800);
    return () => window.clearTimeout(id);
  }, [f.resumePath]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (isLoading || !loaded) return <PageLoader label="Loading config" />;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-16">
      <header className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-cyan/80">
          Configuration
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-50">
          All settings
        </h1>
      </header>

      {missing.length > 0 ? (
        <Card className="border-neon-amber/20 p-4">
          <div className="flex items-start gap-4">
            <Circle className="mt-0.5 h-5 w-5 shrink-0 text-neon-amber" />
            <div>
              <p className="font-display font-semibold text-slate-100">
                Complete your profile to start applying
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Still needed:{' '}
                <span className="text-red-400">{missing.join('  ·  ')}</span>
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-emerald-400/20 p-4">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <p className="font-display font-semibold text-slate-100">
              Profile complete — ready to start applying
            </p>
          </div>
        </Card>
      )}

      {/* 1. Personal Information */}
      <Card className="space-y-4 p-5">
        <SectionHeading>Personal Information</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="First Name"
            value={f.firstName ?? ''}
            onChange={(v) => patch({ firstName: v })}
            placeholder="John"
          />
          <TextField
            label="Last Name"
            value={f.lastName ?? ''}
            onChange={(v) => patch({ lastName: v })}
            placeholder="Doe"
          />
          <TextField
            label="Email"
            value={f.email ?? ''}
            onChange={(v) => patch({ email: v })}
            placeholder="john@example.com"
          />
          <TextField
            label="Phone"
            value={f.phone ?? ''}
            onChange={(v) => patch({ phone: v })}
            placeholder="+1 555 000 0000"
          />
          <TextField
            label="LinkedIn ID"
            value={f.linkedinId ?? ''}
            onChange={(v) => patch({ linkedinId: v })}
            placeholder="johndoe"
          />
          <TextField
            label="City"
            value={f.city ?? ''}
            onChange={(v) => patch({ city: v })}
            placeholder="San Francisco"
          />
          <TextField
            label="Years of Experience"
            value={f.yearsOfExperience ?? ''}
            onChange={(v) => patch({ yearsOfExperience: v })}
            placeholder="7"
          />
        </div>
        <ResumeUpload
          resumePath={f.resumePath ?? ''}
          onResumeChange={(v) => patch({ resumePath: v })}
          fileSuggestions={fileSuggestions}
          onFileInput={handleFileInput}
          analyzing={analyzing}
          analysisMsg={analysisMsg}
          onAnalyze={handleAnalyzeResume}
        />
        {backfillMsg && (
          <p className="text-xs text-emerald-400">{backfillMsg}</p>
        )}
      </Card>

      {/* 2. Job Preferences */}
      <Card className="space-y-4 p-5">
        <SectionHeading>Job Preferences</SectionHeading>
        <div className="space-y-1">
          <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            Target Job Titles (press Enter to add)
          </span>
          <TagInput
            tags={
              f.targetJobTitles
                ? f.targetJobTitles
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                : []
            }
            onTagsChange={(tags) => patch({ targetJobTitles: tags.join(', ') })}
            placeholder="Backend Engineer, Platform Engineer"
            ariaLabel="Target job titles"
            suggestions={titleSuggestions}
            onInputChange={() => setTitleSuggestions([])}
          />
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              leftIcon={
                suggesting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )
              }
              loading={suggesting}
              disabled={!f.jobIntent?.trim()}
              onClick={handleSuggestTitles}
            >
              {suggesting ? 'Suggesting...' : 'Suggest titles'}
            </Button>
            {titleSuggestions.length > 0 && (
              <span className="text-xs text-emerald-400">
                {titleSuggestions.length} titles suggested — click to add
              </span>
            )}
          </div>
          {suggestHint && (
            <p className="text-xs text-neon-amber/90">{suggestHint}</p>
          )}
        </div>
        <TextareaField
          label="Job Intent (free-text)"
          value={f.jobIntent ?? ''}
          onChange={(v) => patch({ jobIntent: v })}
          placeholder="Go-heavy backend / platform roles, remote, async teams"
          rows={2}
        />
        <Select
          label="Work Type"
          value={f.workType ?? ''}
          options={['Remote', 'Onsite', 'Hybrid']}
          onChange={(v) => patch({ workType: v })}
        />
        <div className="space-y-1">
          <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            Target Locations (press Enter to add)
          </span>
          <TagInput
            tags={
              f.targetLocations
                ? f.targetLocations
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                : []
            }
            onTagsChange={(tags) => patch({ targetLocations: tags.join(', ') })}
            placeholder="San Francisco, Remote, Worldwide"
            ariaLabel="Target locations"
            suggestions={locSuggestions}
            onInputChange={handleLocationInput}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Currency"
            value={f.currency ?? ''}
            options={['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD']}
            onChange={(v) => patch({ currency: v })}
          />
          <TextField
            label="Min Salary"
            value={f.minSalary ?? ''}
            onChange={(v) => patch({ minSalary: v })}
            placeholder="100000"
          />
        </div>
      </Card>

      {/* 3. Provider Keys */}
      <Card className="space-y-4 p-5">
        <SectionHeading>Provider Keys</SectionHeading>
        <div className="space-y-2 rounded-xl border border-white/5 bg-ink-800/40 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Always active
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'Greenhouse',
              'Ashby',
              'SmartRecruiters',
              'Lever',
              'Workable',
              'RemoteOK',
              'Remotive',
              'HackerNews',
              'Workday',
            ].map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-400/20 bg-emerald-400/5 px-2 py-0.5 text-xs text-emerald-400"
              >
                <CheckCircle2 className="h-3 w-3" />
                {p}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            No API keys needed — these providers are always available.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="LinkedIn API Token"
            value={f.linkedInKey ?? ''}
            onChange={(v) => patch({ linkedInKey: v })}
            placeholder="LinkedIn API token"
          />
          <TextField
            label="Indeed API Key"
            value={f.indeedKey ?? ''}
            onChange={(v) => patch({ indeedKey: v })}
            placeholder="Indeed API key"
          />
        </div>
      </Card>

      {/* 4. AI Configuration */}
      <Card className="space-y-4 p-5">
        <SectionHeading>AI Configuration</SectionHeading>
        <Toggle
          label="AI Assist (improve quality, scoring, cover letters)"
          value={f.aiAssist ?? false}
          onChange={(v) => patch({ aiAssist: v })}
        />
        {f.aiAssist && (
          <>
            <Select
              label="AI Backend"
              value={f.aiProvider ?? ''}
              options={['local', 'api']}
              onChange={(v) => patch({ aiProvider: v })}
            />
            {f.aiProvider === 'local' && (
              <>
                <TextField
                  label="Local LLM URL"
                  value={f.localLLMURL ?? ''}
                  onChange={(v) => patch({ localLLMURL: v })}
                  placeholder="http://localhost:11434"
                />
                <ModelPicker
                  value={f.localLLMModel ?? ''}
                  onChange={(v) => patch({ localLLMModel: v })}
                  llmStatus={llmStatus}
                  llmLoading={llmLoading}
                  pullingModel={pullingModel}
                  pullProgress={pullProgress}
                  onDownloadModel={handleDownloadModel}
                />
              </>
            )}
            {f.aiProvider === 'api' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Anthropic API Key"
                  value={f.anthropicKey ?? ''}
                  onChange={(v) => patch({ anthropicKey: v })}
                  placeholder="sk-ant-..."
                />
                <TextField
                  label="OpenAI API Key"
                  value={f.openAIKey ?? ''}
                  onChange={(v) => patch({ openAIKey: v })}
                  placeholder="sk-..."
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* 5. Apply Safety */}
      <Card className="space-y-4 p-5">
        <SectionHeading>Apply Safety</SectionHeading>
        <div className="rounded-xl border border-neon-amber/20 bg-neon-amber/5 px-4 py-3 text-sm text-slate-300">
          <strong className="text-neon-amber">
            ⚠ Required for auto-apply.
          </strong>{' '}
          These settings protect you from submitting too many applications too
          fast.
        </div>
        <Toggle
          label="Apply Consent (acknowledge Nexus may submit on your behalf)"
          value={f.applyConsent ?? false}
          onChange={(v) =>
            patch({
              applyConsent: v,
              applyConsentAt: v ? new Date().toISOString() : '',
            })
          }
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            label="Max Apps Per Run"
            value={f.maxAppsPerRun ?? 10}
            onChange={(v) => patch({ maxAppsPerRun: v })}
            min={1}
          />
          <NumberField
            label="Max Apps Per Day"
            value={f.maxAppsPerDay ?? 25}
            onChange={(v) => patch({ maxAppsPerDay: v })}
            min={1}
          />
          <NumberField
            label="Delay (sec)"
            value={f.applyDelaySec ?? 3}
            onChange={(v) => patch({ applyDelaySec: v })}
            min={0}
          />
        </div>
        <NumberField
          label="Min Fit Score"
          value={f.minFitScore ?? 0}
          onChange={(v) => patch({ minFitScore: v })}
          min={0}
        />
        <TextField
          label="Company Blocklist"
          value={f.companyBlocklist ?? ''}
          onChange={(v) => patch({ companyBlocklist: v })}
          placeholder="Acme Staffing, Example Corp"
        />
        <Select
          label="Work Authorization"
          value={f.workAuth ?? 'unspecified'}
          options={['authorized', 'citizen', 'need_sponsorship', 'unspecified']}
          onChange={(v) => patch({ workAuth: v })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Notice Period (days)"
            value={f.noticePeriodDays ?? 30}
            onChange={(v) => patch({ noticePeriodDays: v })}
            min={0}
          />
          <NumberField
            label="Days/Week in Office"
            value={f.officeDaysPerWeek ?? 3}
            onChange={(v) => patch({ officeDaysPerWeek: v })}
            min={0}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Cover Letter Mode"
            value={f.coverLetterMode ?? 'off'}
            options={['off', 'template', 'ai']}
            onChange={(v) => patch({ coverLetterMode: v })}
          />
          {f.coverLetterMode === 'template' && (
            <TextareaField
              label="Cover Letter Template"
              value={f.coverLetterText ?? ''}
              onChange={(v) => patch({ coverLetterText: v })}
              placeholder="I am excited to apply for…"
              rows={4}
            />
          )}
        </div>
      </Card>

      {/* 6. Outreach */}
      <Card className="space-y-4 p-5">
        <SectionHeading>Outreach</SectionHeading>
        <TextField
          label="Gmail App Password"
          value={f.gmailAppPassword ?? ''}
          onChange={(v) => patch({ gmailAppPassword: v })}
          placeholder="16-char app password"
        />
        <TextField
          label="Hunter.io API Key"
          value={f.hunterKey ?? ''}
          onChange={(v) => patch({ hunterKey: v })}
          placeholder="hunter-..."
        />
        <TextField
          label="Apollo.io API Key"
          value={f.apolloKey ?? ''}
          onChange={(v) => patch({ apolloKey: v })}
          placeholder="apollo-..."
        />
        <TextField
          label="LinkedIn Session Cookie"
          value={f.linkedInSessionCookie ?? ''}
          onChange={(v) => patch({ linkedInSessionCookie: v })}
          placeholder="li_at=..."
        />
      </Card>

      {/* 7. Integrations */}
      <Card className="space-y-4 p-5">
        <SectionHeading>Integrations</SectionHeading>
        <TextField
          label="Discord Webhook URL"
          value={f.discordWebhookURL ?? ''}
          onChange={(v) => patch({ discordWebhookURL: v })}
          placeholder="https://discord.com/api/webhooks/..."
        />
        <TextField
          label="Telegram Bot Token"
          value={f.telegramBotToken ?? ''}
          onChange={(v) => patch({ telegramBotToken: v })}
          placeholder="123456:ABC-DEF1234..."
        />
        <TextField
          label="Telegram Chat ID"
          value={f.telegramChatID ?? ''}
          onChange={(v) => patch({ telegramChatID: v })}
          placeholder="-1001234567890"
        />
      </Card>

      {/* 8. Career Scraper */}
      <Card className="space-y-4 p-5">
        <SectionHeading>Career Scraper</SectionHeading>
        <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-ink-800/40 px-4 py-3">
          <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
          <div className="text-sm text-slate-400">
            <p>
              The Career Scraper crawls company career pages to find jobs that
              providers may miss. It runs as a separate service.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Install from the{' '}
              <code className="rounded bg-ink-700 px-1">cmd/pwinstall</code>{' '}
              helper, or set targets below.
            </p>
          </div>
        </div>
        <TextareaField
          label="Scraper Targets (comma-separated Name:URL pairs)"
          value={f.scraperTargets ?? ''}
          onChange={(v) => patch({ scraperTargets: v })}
          placeholder="Stripe:https://stripe.com/jobs, Linear:https://linear.app/careers"
          rows={2}
        />
      </Card>

      {/* 9. Schedule & Notifications */}
      <Card className="space-y-4 p-5">
        <SectionHeading>Schedule &amp; Notifications</SectionHeading>
        <Toggle
          label="Run a daily dry-run search"
          value={f.dailyRunEnabled ?? false}
          onChange={(v) => patch({ dailyRunEnabled: v })}
        />
        {f.dailyRunEnabled && (
          <div className="space-y-1">
            <label
              htmlFor={runTimeId}
              className="block text-xs font-medium uppercase tracking-wider text-slate-500"
            >
              Run time
            </label>
            <input
              id={runTimeId}
              type="time"
              value={f.dailyRunAt ?? '09:00'}
              onChange={(e) => patch({ dailyRunAt: e.target.value })}
              className={inputCls}
            />
          </div>
        )}
        <p className="text-xs text-slate-500">
          The daily run is always a safe dry run — it finds new jobs and submits
          nothing. It fires while the dashboard is open; the Go backend can
          schedule it even when the app is closed (coming soon).
        </p>
        <Toggle
          label="Email me run updates"
          value={f.emailNotifications ?? false}
          onChange={(v) => patch({ emailNotifications: v })}
        />
        <p className="text-xs text-slate-500">
          Requires your Email + Gmail app password (Outreach section above).
          Notifications are sent by the backend.
        </p>
      </Card>

      {/* 10. Notifications */}
      <Card className="space-y-4 p-5">
        <SectionHeading>Notifications</SectionHeading>
        <NotifySettings />
      </Card>

      {/* Save indicator */}
      <div className="flex items-center justify-between border-t border-white/5 pt-5">
        <div>
          {saved && (
            <span className="flex items-center gap-2 font-mono text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Auto-saved
            </span>
          )}
          {update.isError && (
            <span className="text-sm text-red-400">
              Failed to save: {(update.error as Error).message}
            </span>
          )}
        </div>
        <Button
          leftIcon={<Save className="h-4 w-4" />}
          loading={update.isPending}
          onClick={() =>
            update.mutate(f as NexusConfig, { onSuccess: () => setSaved(true) })
          }
        >
          Save now
        </Button>
      </div>
    </div>
  );
}

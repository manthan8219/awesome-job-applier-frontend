import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Save,
  Upload,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/PageLoader';
import { TagInput } from '@/components/config/TagInput';
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

function TextField({ label, value, onChange, placeholder, className }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </div>
  );
}

function NumberField({ label, value, onChange, min, className }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} min={min} className={inputCls} />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 3, className }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={cn(inputCls, 'h-auto resize-y')} />
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <button type="button" onClick={() => onChange(!value)}
        className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors', value ? 'bg-neon-cyan/30' : 'bg-ink-700')}>
        <span className={cn('absolute left-0.5 top-0.5 h-6 w-6 rounded-full transition-all', value ? 'translate-x-5 bg-neon-cyan shadow-glow-cyan' : 'translate-x-0 bg-slate-500')} />
      </button>
    </div>
  );
}

function Select({ label, value, options, onChange, className }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button key={opt} type="button" onClick={() => onChange(opt)}
            className={cn('rounded-lg px-3 py-1.5 text-xs capitalize transition-all', value === opt ? 'bg-neon-cyan/15 text-neon-cyan' : 'bg-ink-800/60 text-slate-400 hover:text-slate-200')}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Resume upload widget                                                      */
/* -------------------------------------------------------------------------- */
function ResumeUpload({ resumePath, onResumeChange }: { resumePath: string; onResumeChange: (path: string) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('Only PDF files are supported.'); return; }
    onResumeChange(file.name);
  }
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">Resume</label>
      {resumePath ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3.5 py-2.5">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <span className="flex-1 truncate text-sm text-slate-200">{resumePath}</span>
          <button type="button" onClick={() => onResumeChange('')} className="text-xs text-red-400 hover:text-red-300">Remove</button>
        </div>
      ) : (
        <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0] ?? undefined); }}
          onClick={() => fileRef.current?.click()}
          className={cn('flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-colors', dragOver ? 'border-neon-cyan bg-neon-cyan/5' : 'border-white/10 bg-ink-950/40 hover:border-neon-cyan/40')}>
          <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)} />
          <Upload className="h-6 w-6 text-slate-500" />
          <p className="text-sm text-slate-400">Drop your PDF resume here, or click to browse</p>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Local LLM Model Picker                                                    */
/* -------------------------------------------------------------------------- */
const MOCK_MODELS = [
  { name: 'llama3.2:latest', display: 'Llama 3.2 (8B)', ram: 8 },
  { name: 'llama3.1:latest', display: 'Llama 3.1 (8B)', ram: 8 },
  { name: 'mistral:latest', display: 'Mistral (7B)', ram: 8 },
  { name: 'codellama:latest', display: 'CodeLlama (7B)', ram: 8 },
  { name: 'phi:latest', display: 'Phi-3 (3.8B)', ram: 4 },
  { name: 'gemma:2b', display: 'Gemma 2B', ram: 4 },
  { name: 'mixtral:8x7b', display: 'Mixtral 8x7B', ram: 32 },
  { name: 'qwen2.5:7b', display: 'Qwen 2.5 (7B)', ram: 8 },
];

function ModelPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">Local Model</label>
      <div className="grid grid-cols-2 gap-1.5">
        {MOCK_MODELS.map((m) => (
          <button key={m.name} type="button" onClick={() => onChange(m.name)}
            className={cn('flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-all',
              value === m.name ? 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan' : 'border-white/5 bg-ink-800/60 text-slate-400 hover:border-white/10 hover:text-slate-200')}>
            <span className="flex-1 truncate">{m.display}</span>
            <span className="shrink-0 text-slate-600">{m.ram}GB</span>
          </button>
        ))}
      </div>
      <TextField label="Custom model name" value={value} onChange={onChange} placeholder="llama3.2:latest" />
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
  if (!f.targetJobTitles?.trim() && !f.jobIntent?.trim()) miss.push('Target Job Titles');
  if (!f.targetLocations?.trim()) miss.push('Target Locations');
  return miss;
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */
export default function ConfigPage() {
  const { data: loaded, isLoading } = useConfig();
  const update = useUpdateConfig();

  const [f, setF] = useState<Partial<NexusConfig>>({});
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

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
        update.mutate(current as NexusConfig, { onSuccess: () => setSaved(true) });
        return current;
      });
    }, 600);
  }

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

  if (isLoading || !loaded) return <PageLoader label="Loading config" />;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-16">
      <header className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-cyan/80">Configuration</p>
        <h1 className="font-display text-3xl font-semibold text-slate-50">All settings</h1>
      </header>

      {missing.length > 0 ? (
        <Card className="border-neon-amber/20 p-4">
          <div className="flex items-start gap-4">
            <Circle className="mt-0.5 h-5 w-5 shrink-0 text-neon-amber" />
            <div>
              <p className="font-display font-semibold text-slate-100">Complete your profile to start applying</p>
              <p className="mt-1 text-sm text-slate-400">Still needed: <span className="text-red-400">{missing.join('  ·  ')}</span></p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-emerald-400/20 p-4">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <p className="font-display font-semibold text-slate-100">Profile complete — ready to start applying</p>
          </div>
        </Card>
      )}

      {/* 1. Personal Information */}
      <Card className="space-y-4 p-5">
        <SectionHeading>Personal Information</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="First Name" value={f.firstName ?? ''} onChange={(v) => patch({ firstName: v })} placeholder="John" />
          <TextField label="Last Name" value={f.lastName ?? ''} onChange={(v) => patch({ lastName: v })} placeholder="Doe" />
          <TextField label="Email" value={f.email ?? ''} onChange={(v) => patch({ email: v })} placeholder="john@example.com" />
          <TextField label="Phone" value={f.phone ?? ''} onChange={(v) => patch({ phone: v })} placeholder="+1 555 000 0000" />
          <TextField label="LinkedIn ID" value={f.linkedinId ?? ''} onChange={(v) => patch({ linkedinId: v })} placeholder="johndoe" />
          <TextField label="City" value={f.city ?? ''} onChange={(v) => patch({ city: v })} placeholder="San Francisco" />
          <TextField label="Years of Experience" value={f.yearsOfExperience ?? ''} onChange={(v) => patch({ yearsOfExperience: v })} placeholder="7" />
        </div>
        <ResumeUpload resumePath={f.resumePath ?? ''} onResumeChange={(v) => patch({ resumePath: v })} />
      </Card>

      {/* 2. Job Preferences */}
      <Card className="space-y-4 p-5">
        <SectionHeading>Job Preferences</SectionHeading>
        <div className="space-y-1">
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">Target Job Titles (press Enter to add)</label>
          <TagInput
            tags={f.targetJobTitles ? f.targetJobTitles.split(',').map((t) => t.trim()).filter(Boolean) : []}
            onTagsChange={(tags) => patch({ targetJobTitles: tags.join(', ') })}
            placeholder="Backend Engineer, Platform Engineer"
          />
        </div>
        <TextareaField label="Job Intent (free-text)" value={f.jobIntent ?? ''} onChange={(v) => patch({ jobIntent: v })} placeholder="Go-heavy backend / platform roles, remote, async teams" rows={2} />
        <Select label="Work Type" value={f.workType ?? ''} options={['Remote', 'Onsite', 'Hybrid']} onChange={(v) => patch({ workType: v })} />
        <div className="space-y-1">
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">Target Locations (press Enter to add)</label>
          <TagInput
            tags={f.targetLocations ? f.targetLocations.split(',').map((t) => t.trim()).filter(Boolean) : []}
            onTagsChange={(tags) => patch({ targetLocations: tags.join(', ') })}
            placeholder="San Francisco, Remote, Worldwide"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Currency" value={f.currency ?? ''} options={['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD']} onChange={(v) => patch({ currency: v })} />
          <TextField label="Min Salary" value={f.minSalary ?? ''} onChange={(v) => patch({ minSalary: v })} placeholder="100000" />
        </div>
      </Card>

      {/* 3. Provider Keys */}
      <Card className="space-y-4 p-5">
        <SectionHeading>Provider Keys</SectionHeading>
        <div className="space-y-2 rounded-xl border border-white/5 bg-ink-800/40 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Always active</p>
          <div className="flex flex-wrap gap-2">
            {['Greenhouse','Ashby','SmartRecruiters','Lever','Workable','RemoteOK','Remotive','HackerNews','Workday'].map((p) => (
              <span key={p} className="inline-flex items-center gap-1 rounded-md border border-emerald-400/20 bg-emerald-400/5 px-2 py-0.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />{p}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-500">No API keys needed — these providers are always available.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="LinkedIn API Token" value={f.linkedInKey ?? ''} onChange={(v) => patch({ linkedInKey: v })} placeholder="LinkedIn API token" />
          <TextField label="Indeed API Key" value={f.indeedKey ?? ''} onChange={(v) => patch({ indeedKey: v })} placeholder="Indeed API key" />
        </div>
      </Card>

      {/* 4. AI Configuration */}
      <Card className="space-y-4 p-5">
        <SectionHeading>AI Configuration</SectionHeading>
        <Toggle label="AI Assist (improve quality, scoring, cover letters)" value={f.aiAssist ?? false} onChange={(v) => patch({ aiAssist: v })} />
        {f.aiAssist && (
          <>
            <Select label="AI Backend" value={f.aiProvider ?? ''} options={['local', 'api']} onChange={(v) => patch({ aiProvider: v })} />
            {f.aiProvider === 'local' && (
              <>
                <TextField label="Local LLM URL" value={f.localLLMURL ?? ''} onChange={(v) => patch({ localLLMURL: v })} placeholder="http://localhost:11434" />
                <ModelPicker value={f.localLLMModel ?? ''} onChange={(v) => patch({ localLLMModel: v })} />
              </>
            )}
            {f.aiProvider === 'api' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Anthropic API Key" value={f.anthropicKey ?? ''} onChange={(v) => patch({ anthropicKey: v })} placeholder="sk-ant-..." />
                <TextField label="OpenAI API Key" value={f.openAIKey ?? ''} onChange={(v) => patch({ openAIKey: v })} placeholder="sk-..." />
              </div>
            )}
          </>
        )}
      </Card>

      {/* 5. Apply Safety */}
      <Card className="space-y-4 p-5">
        <SectionHeading>Apply Safety</SectionHeading>
        <div className="rounded-xl border border-neon-amber/20 bg-neon-amber/5 px-4 py-3 text-sm text-slate-300">
          <strong className="text-neon-amber">⚠ Required for auto-apply.</strong> These settings protect you from submitting too many applications too fast.
        </div>
        <Toggle label="Apply Consent (acknowledge Nexus may submit on your behalf)" value={f.applyConsent ?? false}
          onChange={(v) => patch({ applyConsent: v, applyConsentAt: v ? new Date().toISOString() : '' })} />
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField label="Max Apps Per Run" value={f.maxAppsPerRun ?? 10} onChange={(v) => patch({ maxAppsPerRun: v })} min={1} />
          <NumberField label="Max Apps Per Day" value={f.maxAppsPerDay ?? 25} onChange={(v) => patch({ maxAppsPerDay: v })} min={1} />
          <NumberField label="Delay (sec)" value={f.applyDelaySec ?? 3} onChange={(v) => patch({ applyDelaySec: v })} min={0} />
        </div>
        <NumberField label="Min Fit Score" value={f.minFitScore ?? 0} onChange={(v) => patch({ minFitScore: v })} min={0} />
        <TextField label="Company Blocklist" value={f.companyBlocklist ?? ''} onChange={(v) => patch({ companyBlocklist: v })} placeholder="Acme Staffing, Example Corp" />
        <Select label="Work Authorization" value={f.workAuth ?? 'unspecified'} options={['authorized', 'citizen', 'need_sponsorship', 'unspecified']} onChange={(v) => patch({ workAuth: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Notice Period (days)" value={f.noticePeriodDays ?? 30} onChange={(v) => patch({ noticePeriodDays: v })} min={0} />
          <NumberField label="Days/Week in Office" value={f.officeDaysPerWeek ?? 3} onChange={(v) => patch({ officeDaysPerWeek: v })} min={0} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Cover Letter Mode" value={f.coverLetterMode ?? 'off'} options={['off', 'template', 'ai']} onChange={(v) => patch({ coverLetterMode: v })} />
          {f.coverLetterMode === 'template' && (
            <TextareaField label="Cover Letter Template" value={f.coverLetterText ?? ''} onChange={(v) => patch({ coverLetterText: v })} placeholder="I am excited to apply for…" rows={4} />
          )}
        </div>
      </Card>

      {/* 6. Outreach */}
      <Card className="space-y-4 p-5">
        <SectionHeading>Outreach</SectionHeading>
        <TextField label="Gmail App Password" value={f.gmailAppPassword ?? ''} onChange={(v) => patch({ gmailAppPassword: v })} placeholder="16-char app password" />
        <TextField label="Hunter.io API Key" value={f.hunterKey ?? ''} onChange={(v) => patch({ hunterKey: v })} placeholder="hunter-..." />
        <TextField label="Apollo.io API Key" value={f.apolloKey ?? ''} onChange={(v) => patch({ apolloKey: v })} placeholder="apollo-..." />
        <TextField label="LinkedIn Session Cookie" value={f.linkedInSessionCookie ?? ''} onChange={(v) => patch({ linkedInSessionCookie: v })} placeholder="li_at=..." />
      </Card>

      {/* 7. Integrations */}
      <Card className="space-y-4 p-5">
        <SectionHeading>Integrations</SectionHeading>
        <TextField label="Discord Webhook URL" value={f.discordWebhookURL ?? ''} onChange={(v) => patch({ discordWebhookURL: v })} placeholder="https://discord.com/api/webhooks/..." />
        <TextField label="Telegram Bot Token" value={f.telegramBotToken ?? ''} onChange={(v) => patch({ telegramBotToken: v })} placeholder="123456:ABC-DEF1234..." />
        <TextField label="Telegram Chat ID" value={f.telegramChatID ?? ''} onChange={(v) => patch({ telegramChatID: v })} placeholder="-1001234567890" />
      </Card>

      {/* 8. Career Scraper */}
      <Card className="space-y-4 p-5">
        <SectionHeading>Career Scraper</SectionHeading>
        <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-ink-800/40 px-4 py-3">
          <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
          <div className="text-sm text-slate-400">
            <p>The Career Scraper crawls company career pages to find jobs that providers may miss. It runs as a separate service.</p>
            <p className="mt-1 text-xs text-slate-500">Install from the <code className="rounded bg-ink-700 px-1">cmd/pwinstall</code> helper, or set targets below.</p>
          </div>
        </div>
        <TextareaField label="Scraper Targets (comma-separated Name:URL pairs)" value={f.scraperTargets ?? ''} onChange={(v) => patch({ scraperTargets: v })} placeholder="Stripe:https://stripe.com/jobs, Linear:https://linear.app/careers" rows={2} />
      </Card>

      {/* Save indicator */}
      <div className="flex items-center justify-between border-t border-white/5 pt-5">
        <div>
          {saved && <span className="flex items-center gap-2 font-mono text-sm text-emerald-400"><CheckCircle2 className="h-4 w-4" />Auto-saved</span>}
          {update.isError && <span className="text-sm text-red-400">Failed to save: {(update.error as Error).message}</span>}
        </div>
        <Button leftIcon={<Save className="h-4 w-4" />} loading={update.isPending} onClick={() => update.mutate(f as NexusConfig, { onSuccess: () => setSaved(true) })}>Save now</Button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Columns,
  FileText,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionHeading } from './SectionHeading';
import { useImproveResume } from '@/hooks/useImproveResume';
import { useConfig } from '@/hooks/useConfig';
import { useResumeProjects } from '@/hooks/useResumeProjects';
import { useResumeTemplates } from '@/hooks/useResumeTemplates';
import { cn } from '@/lib/utils';
import {
  RESUME_FORMATS,
  RESUME_TEMPLATES,
  TEMPLATE_DEFAULT_ID,
} from '@/types/resume';
import type {
  ImproveOutput,
  ResumeFormat,
  ResumeTemplate,
} from '@/types/resume';

const inputCls =
  'w-full rounded-xl border border-white/5 bg-ink-950/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 transition-colors focus:border-neon-cyan/40 focus:outline-none';

function ScoreGauge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const barTone = tone === 'text-neon-cyan' ? 'bg-neon-cyan' : 'bg-neon-violet';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="uppercase tracking-wider text-slate-500">{label}</span>
        <span className={cn('font-mono font-semibold', tone)}>{value}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-700">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-700',
            barTone,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Validate the `/resume/improve` response before rendering. The backend may
 * return an incomplete shape (currently a stub) — rendering it blindly would
 * crash the tab, so we fall back to a graceful message instead.
 */
function isImproveOutput(out: unknown): out is ImproveOutput {
  const o = out as ImproveOutput | null;
  return (
    typeof o === 'object' &&
    o !== null &&
    typeof o.previewMD === 'string' &&
    typeof o.dir === 'string' &&
    typeof o.review === 'object' &&
    o.review !== null &&
    typeof o.review.atsScore === 'number' &&
    typeof o.review.qualityScore === 'number'
  );
}

function ResultPanel({ out }: { out: ImproveOutput }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <Card className="space-y-4 p-5">
        <SectionHeading>Assessor verdict</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <ScoreGauge
            label="ATS"
            value={out.review.atsScore}
            tone="text-neon-cyan"
          />
          <ScoreGauge
            label="Quality"
            value={out.review.qualityScore}
            tone="text-neon-violet"
          />
        </div>
        {out.review.summary && (
          <p className="text-sm text-slate-200">{out.review.summary}</p>
        )}
        <p className="font-mono text-xs text-slate-500">Saved to {out.dir}</p>
        {out.templateName && (
          <p className="font-mono text-xs text-slate-500">
            Template: {out.templateName}
          </p>
        )}
        {out.pdfNote && (
          <p className="font-mono text-xs text-neon-amber/80">
            PDF: {out.pdfNote}
          </p>
        )}
      </Card>
      <Card className="space-y-3 p-5">
        <SectionHeading>Preview</SectionHeading>
        <pre className="no-scrollbar max-h-[28rem] overflow-auto rounded-xl border border-white/5 bg-ink-950/80 p-4 font-mono text-xs leading-relaxed text-slate-300">
          {out.previewMD}
        </pre>
      </Card>
    </motion.div>
  );
}
/**
 * Tiny skeleton of each template's layout — header accent bar, section lines
 * and (for two-column templates) the skills/education rail on the declared side.
 */
function TemplatePreview({ t }: { t: ResumeTemplate }) {
  const isSidebar = t.layout === 'sidebar';
  const railRight = t.railSide === 'right';
  const main = (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div
        className="h-2 w-1/2 rounded-sm"
        style={{ backgroundColor: t.accentHex }}
      />
      <div className="h-1 w-full rounded-sm bg-white/10" />
      <div className="h-1 w-3/4 rounded-sm bg-white/10" />
      <div className="h-1 w-full rounded-sm bg-white/10" />
    </div>
  );
  const rail = (
    <div className="flex w-5 shrink-0 flex-col gap-1">
      <div
        className="h-1 w-full rounded-sm"
        style={{ backgroundColor: t.accentHex, opacity: 0.75 }}
      />
      <div className="h-1 w-full rounded-sm bg-white/10" />
      <div className="h-1 w-full rounded-sm bg-white/10" />
      <div className="h-1 w-1/2 rounded-sm bg-white/10" />
    </div>
  );
  return (
    <div className="flex h-16 gap-1.5 rounded-lg border border-white/5 bg-ink-950/80 p-1.5">
      {isSidebar && railRight ? rail : null}
      {main}
      {isSidebar && !railRight ? rail : null}
    </div>
  );
}

function TemplatePicker({
  templates,
  selected,
  onSelect,
}: {
  templates: ResumeTemplate[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {templates.map((t) => {
        const on = selected === t.id;
        return (
          <button
            key={t.id}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(t.id)}
            className={cn(
              'flex flex-col gap-2 rounded-xl border p-3 text-left transition-all',
              on
                ? 'border-neon-cyan/50 bg-neon-cyan/10 shadow-glow-soft'
                : 'border-white/5 bg-ink-800/40 text-slate-400 hover:border-white/15 hover:bg-white/5',
            )}
          >
            <TemplatePreview t={t} />
            <span className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: t.accentHex }}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    on ? 'text-neon-cyan' : 'text-slate-200',
                  )}
                >
                  {t.name}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                {t.bodyFont === 'mono' ? (
                  <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400">
                    mono
                  </span>
                ) : t.bodyFont === 'serif' ? (
                  <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400">
                    serif
                  </span>
                ) : null}
                {t.layout === 'sidebar' ? (
                  <Columns className="h-3.5 w-3.5" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                {t.onePage && (
                  <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400">
                    1 page
                  </span>
                )}
              </span>
            </span>
            <span className="text-[11px] leading-snug text-slate-500">
              {t.description}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <ShieldCheck className="h-3 w-3 shrink-0" />
              {t.atsNote}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ImproveTab() {
  const { data: cfg } = useConfig();
  const { data: projects } = useResumeProjects();
  const { data: apiTemplates } = useResumeTemplates();
  const improve = useImproveResume();

  // Fall back to the static registry when the API is unreachable/empty.
  const templates: ResumeTemplate[] =
    apiTemplates && apiTemplates.length > 0 ? apiTemplates : RESUME_TEMPLATES;
  const [templateId, setTemplateId] = useState<string>(TEMPLATE_DEFAULT_ID);
  const [formats, setFormats] = useState<Set<ResumeFormat>>(
    new Set<ResumeFormat>(['markdown', 'latex', 'pdf']),
  );
  const [targetRole, setTargetRole] = useState('');

  const aiOn = Boolean(cfg?.aiAssist);
  const hasResume = Boolean(cfg?.resumePath?.trim());
  const projectCount = projects?.length ?? 0;
  const ready = aiOn && hasResume && projectCount > 0 && formats.size > 0;

  const checks: { label: string; ok: boolean }[] = [
    { label: 'AI Assist on', ok: aiOn },
    { label: 'Resume path set in Config', ok: hasResume },
    {
      label: `${projectCount} project${projectCount === 1 ? '' : 's'} added`,
      ok: projectCount > 0,
    },
  ];

  function toggleFormat(f: ResumeFormat) {
    setFormats((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neon-cyan/80">
          Step 3 — New resume
        </p>
        <p className="text-sm text-slate-400">
          AI rewrites using Step 1 + Step 2. PDF saves to ~/.nexus/resumes/ —
          pick it in Config.
        </p>
      </div>

      <Card className="space-y-3 p-5">
        <SectionHeading>Ready</SectionHeading>
        <ul className="space-y-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2 text-sm">
              {c.ok ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-neon-amber" />
              )}
              <span className={c.ok ? 'text-slate-200' : 'text-slate-400'}>
                {c.label}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-4 p-5">
        <SectionHeading>Template</SectionHeading>
        <p className="text-xs text-slate-500">
          Choose the design your improved resume is written into. The AI follows
          the template's section order, layout, and page constraints.
        </p>
        <TemplatePicker
          templates={templates}
          selected={templateId}
          onSelect={setTemplateId}
        />
      </Card>

      <Card className="space-y-4 p-5">
        <SectionHeading>Formats</SectionHeading>
        <div className="flex flex-wrap gap-2">
          {RESUME_FORMATS.map((f) => {
            const on = formats.has(f.value);
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => toggleFormat(f.value)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all',
                  on
                    ? 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan'
                    : 'border-white/5 bg-ink-800/40 text-slate-400 hover:bg-white/5',
                )}
              >
                <span
                  className={cn(
                    'grid h-4 w-4 place-items-center rounded text-[9px] font-bold',
                    on
                      ? 'bg-neon-cyan text-ink-950'
                      : 'bg-white/5 text-slate-500',
                  )}
                >
                  {on ? <CheckCircle2 className="h-3 w-3" /> : ''}
                </span>
                <span>
                  <span className="block text-xs font-medium">{f.label}</span>
                  <span className="block text-[10px] text-slate-500">
                    {f.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <label className="space-y-1">
          <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            Target role
          </span>
          <input
            className={inputCls}
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Senior Backend Engineer (auto from profile if blank)"
          />
        </label>

        <div className="flex items-center gap-3">
          <Button
            leftIcon={<Wand2 className="h-4 w-4" />}
            loading={improve.isPending}
            disabled={!ready || improve.isPending}
            onClick={() =>
              improve.mutate({
                targetRole: targetRole.trim(),
                formats: [...formats],
                templateId,
              })
            }
          >
            {improve.isPending ? 'Generating…' : 'Generate resume'}
          </Button>
          {improve.isError && (
            <span className="text-sm text-red-400">
              {(improve.error as Error)?.message ?? 'generation failed'}
            </span>
          )}
        </div>
      </Card>

      {improve.isPending && (
        <Card className="flex items-center gap-3 p-5">
          <Sparkles className="h-5 w-5 shrink-0 animate-pulse-glow text-neon-cyan" />
          <p className="font-mono text-sm text-slate-300">
            AI is writing your resume + running the assessor loop…
          </p>
        </Card>
      )}

      {improve.data &&
        (isImproveOutput(improve.data) ? (
          <ResultPanel out={improve.data} />
        ) : (
          <Card className="space-y-2 border-neon-amber/20 p-5">
            <p className="flex items-center gap-2 text-sm text-neon-amber">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Resume generation returned an incomplete response.
            </p>
            <p className="text-xs text-slate-500">
              This backend does not support resume generation yet — generate
              from the TUI (Resume tab), then pick the PDF in Config.
            </p>
          </Card>
        ))}
    </div>
  );
}

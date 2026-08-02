import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Columns,
  ExternalLink,
  Eye,
  FileText,
  Scissors,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionHeading } from './SectionHeading';
import { TemplatePreview } from './TemplatePreview';
import { useImproveResume } from '@/hooks/useImproveResume';
import { useConfig } from '@/hooks/useConfig';
import { useResumeAnalysis } from '@/hooks/useResumeAnalysis';
import { useResumeProjects } from '@/hooks/useResumeProjects';
import { useResumeTemplates } from '@/hooks/useResumeTemplates';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  RESUME_FORMATS,
  RESUME_TEMPLATES,
  TEMPLATE_DEFAULT_ID,
} from '@/types/resume';
import type {
  ImproveOutput,
  PreviewResumeDoc,
  ResumeFit,
  ResumeFormat,
  ResumeSpaceBudget,
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
 * Small capacity chips for a template card: how much content the design holds
 * (roles / bullets / skills / education). Mirrors the backend SpaceBudget that
 * the AI writes to and the planner enforces.
 */
function BudgetChips({ budget }: { budget: ResumeSpaceBudget }) {
  const parts: string[] = [];
  if (budget.maxRoles) parts.push(`≤${budget.maxRoles} roles`);
  if (budget.maxBulletsPerRole)
    parts.push(`≤${budget.maxBulletsPerRole} bullets`);
  if (budget.maxSkills) parts.push(`≤${budget.maxSkills} skills`);
  if (budget.maxEducation) parts.push(`≤${budget.maxEducation} edu`);
  if (parts.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1.5">
      {parts.map((p) => (
        <span
          key={p}
          className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400"
        >
          {p}
        </span>
      ))}
    </span>
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

function FitReport({ fit }: { fit: ResumeFit }) {
  const pages = fit.pages ?? Math.ceil(fit.estimatedPages ?? 1);
  return (
    <Card className="space-y-3 p-5">
      <SectionHeading>Fit report</SectionHeading>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-ink-800/40 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
            Fit score
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-neon-cyan">
            {fit.fitScore ?? '—'}/100
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-ink-800/40 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
            Rendered
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-slate-100">
            {pages} page{pages === 1 ? '' : 's'}
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-ink-800/40 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
            Content lines
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-slate-100">
            {fit.plannedLines ?? '—'}
            {fit.targetLines ? `/${fit.targetLines}` : ''}
          </p>
        </div>
      </div>
      {fit.trimmedSections && fit.trimmedSections.length > 0 && (
        <div className="space-y-1 rounded-xl border border-neon-amber/20 bg-neon-amber/5 p-3">
          <p className="flex items-center gap-2 text-xs font-medium text-neon-amber">
            <Scissors className="h-3.5 w-3.5 shrink-0" />
            Trimmed to fit the template
          </p>
          <ul className="list-disc space-y-0.5 pl-5 text-xs text-slate-300">
            {fit.trimmedSections.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
      {fit.warnings && fit.warnings.length > 0 && (
        <div className="space-y-1 rounded-xl border border-white/5 bg-ink-800/40 p-3">
          <p className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-neon-amber" />
            Notes
          </p>
          <ul className="list-disc space-y-0.5 pl-5 text-xs text-slate-400">
            {fit.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function ResultPanel({ out }: { out: ImproveOutput }) {
  const [view, setView] = useState<'pdf' | 'markdown'>('pdf');
  const pdfUrl = out.pdfId ? api.resumePdfUrl(out.pdfId) : null;
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
      {out.fit && <FitReport fit={out.fit} />}
      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <SectionHeading>Preview</SectionHeading>
          <div className="flex overflow-hidden rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setView('pdf')}
              disabled={!pdfUrl}
              aria-pressed={view === 'pdf'}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                view === 'pdf'
                  ? 'bg-neon-cyan/15 text-neon-cyan'
                  : 'bg-transparent text-slate-400 hover:text-slate-200',
                !pdfUrl && 'cursor-not-allowed opacity-40',
              )}
            >
              PDF
            </button>
            <button
              type="button"
              onClick={() => setView('markdown')}
              aria-pressed={view === 'markdown'}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                view === 'markdown'
                  ? 'bg-neon-cyan/15 text-neon-cyan'
                  : 'bg-transparent text-slate-400 hover:text-slate-200',
              )}
            >
              Markdown
            </button>
          </div>
        </div>
        {view === 'pdf' && pdfUrl ? (
          <div className="flex flex-col gap-2">
            <object
              data={pdfUrl}
              type="application/pdf"
              aria-label="Generated resume PDF"
              className="h-[34rem] w-full rounded-xl border border-white/5 bg-white"
            >
              <p className="p-4 text-sm text-slate-400">
                Your browser can't show PDFs inline —{' '}
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-neon-cyan underline"
                >
                  open the PDF
                </a>
                .
              </p>
            </object>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-neon-cyan/80 transition-colors hover:text-neon-cyan"
            >
              <ExternalLink className="h-3 w-3" />
              Open PDF in a new tab
            </a>
          </div>
        ) : (
          <pre className="no-scrollbar max-h-[28rem] overflow-auto rounded-xl border border-white/5 bg-ink-950/80 p-4 font-mono text-xs leading-relaxed text-slate-300">
            {out.previewMD}
          </pre>
        )}
      </Card>
    </motion.div>
  );
}
function MetaChip({ children }: { children: string }) {
  return (
    <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400">
      {children}
    </span>
  );
}

/** Templates the editor highlights as favorites in the gallery. */
const TOP_PICK_IDS = new Set(['jake', 'awesome-cv', 'macchiato']);

function TemplatePicker({
  templates,
  selected,
  onSelect,
  canPreview,
}: {
  templates: ResumeTemplate[];
  selected: string;
  onSelect: (id: string) => void;
  canPreview: boolean;
}) {
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
        {templates.length} templates · Choose your design
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((t) => {
          const on = selected === t.id;
          const topPick = TOP_PICK_IDS.has(t.id);
          return (
            <div
              key={t.id}
              className={cn(
                'group flex flex-col overflow-hidden rounded-xl border transition-all duration-200',
                on
                  ? 'bg-ink-800/70'
                  : 'border-white/[0.08] bg-ink-800/50 hover:-translate-y-0.5 hover:border-white/20 hover:bg-ink-800/70 hover:shadow-lg',
              )}
              style={
                on
                  ? {
                      borderColor: `${t.accentHex}99`,
                      boxShadow: `0 0 0 2px ${t.accentHex}4d`,
                    }
                  : undefined
              }
            >
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onSelect(t.id)}
                className="flex w-full flex-1 flex-col gap-2.5 p-2.5 text-left sm:p-3"
              >
                <div className="relative h-64 shrink-0 overflow-hidden rounded-lg">
                  <TemplatePreview template={t} />
                  {topPick && (
                    <span className="absolute left-1.5 top-1.5 z-20 rounded bg-neon-cyan/90 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-ink-950">
                      Top pick
                    </span>
                  )}
                  {on && (
                    <span
                      aria-hidden="true"
                      className="absolute right-1.5 top-1.5 z-20 grid h-5 w-5 place-items-center rounded-full shadow-md"
                      style={{ backgroundColor: t.accentHex }}
                    >
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </span>
                  )}
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink-950/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span
                      className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
                      style={{
                        backgroundColor: on
                          ? 'rgba(255,255,255,0.18)'
                          : t.accentHex,
                      }}
                    >
                      {on ? '✓ Selected' : 'Select'}
                    </span>
                  </div>
                </div>
                <span
                  className="border-l-2 pl-2 text-sm font-semibold text-slate-100"
                  style={{ borderColor: t.accentHex }}
                >
                  {t.name}
                </span>
                <span className="line-clamp-2 text-xs leading-snug text-slate-400">
                  {t.description}
                </span>
                <span className="flex flex-wrap items-center gap-1.5">
                  {t.layout === 'sidebar' ? (
                    <Columns className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  )}
                  {t.onePage && <MetaChip>1 page</MetaChip>}
                  {t.bodyFont === 'mono' && <MetaChip>mono</MetaChip>}
                  {t.bodyFont === 'serif' && <MetaChip>serif</MetaChip>}
                  <span
                    title={t.atsNote}
                    className="flex items-center gap-1 text-[10px] text-slate-500"
                  >
                    <ShieldCheck className="h-3 w-3 shrink-0" />
                    ATS
                  </span>
                </span>
                {t.budget && <BudgetChips budget={t.budget} />}
                {t.source && (
                  <span className="truncate font-mono text-[9px] text-slate-600">
                    ⤳ {t.source}
                  </span>
                )}
              </button>
              {canPreview && (
                <a
                  href={api.templatePreviewUrl(t.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 border-t border-white/5 px-3 py-1.5 text-[10px] font-medium text-neon-cyan/80 transition-colors hover:bg-white/5 hover:text-neon-cyan"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  View sample PDF
                </a>
              )}
              <div
                data-testid="template-accent-bar"
                className="h-[3px] w-full shrink-0"
                style={{ backgroundColor: t.accentHex }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ImproveTab() {
  const { data: cfg } = useConfig();
  const { data: projects } = useResumeProjects();
  const { data: apiTemplates } = useResumeTemplates();
  const { data: analysis } = useResumeAnalysis();
  const improve = useImproveResume();

  // Fall back to the static registry when the API is unreachable/empty.
  const templates: ResumeTemplate[] =
    apiTemplates && apiTemplates.length > 0 ? apiTemplates : RESUME_TEMPLATES;
  // "View sample PDF" needs the backend renderer — only offer it when the
  // registry came from the API (the offline fallback has no PDF server).
  const templatesFromApi = Boolean(apiTemplates && apiTemplates.length > 0);
  const [templateId, setTemplateId] = useState<string>(TEMPLATE_DEFAULT_ID);
  const [formats, setFormats] = useState<Set<ResumeFormat>>(
    new Set<ResumeFormat>(['markdown', 'latex', 'pdf']),
  );
  const [targetRole, setTargetRole] = useState('');

  // "Preview with my data" — renders the user's current profile + projects +
  // skills into the selected template without running the AI pipeline.
  const [myDataUrl, setMyDataUrl] = useState<string | null>(null);
  const [myDataLoading, setMyDataLoading] = useState(false);
  const [myDataError, setMyDataError] = useState<string | null>(null);

  useEffect(() => {
    // Revoke the blob URL when it changes or the tab unmounts.
    return () => {
      if (myDataUrl) URL.revokeObjectURL(myDataUrl);
    };
  }, [myDataUrl]);

  function buildPreviewDoc(): PreviewResumeDoc {
    const profile = analysis?.profile ?? null;
    const contact = analysis?.contact ?? null;
    const name = [contact?.firstName, contact?.lastName]
      .filter(Boolean)
      .join(' ');
    const roles = profile?.suitableRoles ?? [];
    const experience = (projects ?? []).map((p) => ({
      title: p.role || 'Role',
      org: p.name,
      period: p.period,
      bullets: p.summary
        .split('\n')
        .map((l) => l.replace(/^[-•]\s*/, '').trim())
        .filter(Boolean),
    }));
    return {
      fullName: name || undefined,
      headline: targetRole.trim() || roles[0] || undefined,
      email: contact?.email || undefined,
      phone: contact?.phone || undefined,
      summary: profile?.summary || undefined,
      skills: profile?.skills?.length ? profile.skills : undefined,
      experience: experience.length ? experience : undefined,
    };
  }

  async function previewWithMyData() {
    setMyDataLoading(true);
    setMyDataError(null);
    setMyDataUrl(null);
    try {
      const blob = await api.previewTemplateWithData(
        templateId,
        buildPreviewDoc(),
      );
      setMyDataUrl(URL.createObjectURL(blob));
    } catch (err) {
      setMyDataError((err as Error)?.message ?? 'preview failed');
    } finally {
      setMyDataLoading(false);
    }
  }

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
          canPreview={templatesFromApi}
        />
        <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              leftIcon={<Eye className="h-4 w-4" />}
              loading={myDataLoading}
              disabled={
                !templatesFromApi || projectCount === 0 || improve.isPending
              }
              onClick={previewWithMyData}
            >
              Preview with my data
            </Button>
            <p className="max-w-md text-xs text-slate-500">
              Renders your current profile + {projectCount} project
              {projectCount === 1 ? '' : 's'} in{' '}
              {templates.find((t) => t.id === templateId)?.name ??
                'the selected template'}{' '}
              with the real PDF engine — no AI credits used.
            </p>
          </div>
          {myDataError && (
            <p className="text-xs text-red-400">
              Preview failed: {myDataError}
            </p>
          )}
          {myDataUrl && (
            <div className="flex flex-col gap-2">
              <object
                data={myDataUrl}
                type="application/pdf"
                aria-label="Your resume preview"
                className="h-[30rem] w-full rounded-xl border border-white/5 bg-white"
              >
                <p className="p-4 text-sm text-slate-400">
                  Your browser can't show PDFs inline —{' '}
                  <a
                    href={myDataUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-neon-cyan underline"
                  >
                    open the preview
                  </a>
                  .
                </p>
              </object>
            </div>
          )}
        </div>
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

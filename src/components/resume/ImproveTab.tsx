import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionHeading } from './SectionHeading';
import { useImproveResume } from '@/hooks/useImproveResume';
import { useConfig } from '@/hooks/useConfig';
import { useResumeProjects } from '@/hooks/useResumeProjects';
import { cn } from '@/lib/utils';
import { RESUME_FORMATS } from '@/types/resume';
import type { ImproveOutput, ResumeFormat } from '@/types/resume';

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
export function ImproveTab() {
  const { data: cfg } = useConfig();
  const { data: projects } = useResumeProjects();
  const improve = useImproveResume();

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

      {improve.data && <ResultPanel out={improve.data} />}
    </div>
  );
}

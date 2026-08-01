import { useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { Application } from '@/types';

const PROFILE_LABELS: Record<string, string> = {
  first_name: 'First name',
  last_name: 'Last name',
  email: 'Email',
  phone: 'Phone',
  location: 'Location',
  city: 'City',
  resume_path: 'Resume',
  resume_url_filename: 'Resume filename',
  cover_letter_text: 'Cover letter',
};

function labelFor(key: string): string {
  const known = PROFILE_LABELS[key];
  if (known) return known;
  return key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Submitted payload audit (KAN-33): shows exactly what data Nexus sent to the
 * employer for one application — profile fields, the resume file, and every
 * question→answer pair (AI-generated answers flagged). Collapsible so the
 * detail stays out of the way; renders a clear empty state when not recorded.
 */
export function SubmittedPayloadCard({ app }: { app: Application }) {
  const [open, setOpen] = useState(false);
  const payload = app.submittedPayload;
  const hasProfile =
    payload?.profile != null && Object.keys(payload.profile).length > 0;
  const hasResume = payload?.resume != null;
  const hasAnswers = payload?.answers != null && payload.answers.length > 0;

  if (!payload || (!hasProfile && !hasResume && !hasAnswers)) {
    return (
      <Card className="space-y-3 p-6">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet/80">
          Submitted payload
        </h2>
        <p className="text-sm text-slate-500">
          No payload recorded for this application. It is captured when the
          backend submits a real application.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-3 p-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Toggle submitted payload"
        className="flex w-full items-center justify-between gap-2"
      >
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet/80">
          Submitted payload
        </h2>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-slate-500 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      <p className="text-xs text-slate-500">
        Exactly what Nexus sent to {app.company} for this application.
      </p>

      {open && (
        <div className="space-y-4">
          {hasProfile && (
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(payload.profile!).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-ink-800/40 px-3 py-2">
                  <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                    {labelFor(key)}
                  </span>
                  <span className="break-words text-sm text-slate-200">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {hasResume && (
            <div className="flex items-center gap-2 rounded-lg bg-ink-800/40 px-3 py-2 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-neon-cyan" />
              <span className="truncate font-mono text-slate-200">
                {payload.resume!.filename}
              </span>
              {payload.resume!.checksum && (
                <span className="ml-auto shrink-0 font-mono text-[10px] text-slate-500">
                  sha {payload.resume!.checksum}
                </span>
              )}
            </div>
          )}

          {hasAnswers && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">
                Form answers
              </p>
              {payload.answers!.map((a, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/5 bg-ink-950/60 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-300">
                      {a.question}
                    </span>
                    {a.aiGenerated && (
                      <span className="rounded bg-neon-violet/15 px-1.5 py-0.5 text-[10px] font-semibold text-neon-violet">
                        AI
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-400">{a.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

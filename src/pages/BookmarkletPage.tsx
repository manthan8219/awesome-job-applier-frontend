import { useMemo } from 'react';
import { Bookmark, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Link } from 'react-router-dom';

/**
 * Bookmarklet installer: shows a small drag-to-bookmarks javascript: snippet
 * that reads the current job posting (title + URL + domain) and opens the
 * JobPilot "Add a job" form pre-filled in a same-origin popup (no CORS needed).
 */
export default function BookmarkletPage() {
  const snippet = useMemo(() => {
    const origin = window.location.origin;
    // Compact one-liner bookmarklet (no IIFE commas issues in some browsers).
    return `javascript:(function(){var t=document.title||'';var u=location.href||'';var d=location.hostname.replace(/^www\\./,'');var c=d.split('.')[0]||'';var m=t.split(/\\s+[-–|·]\\s+/);var r=m[0]||t;var co=(m[1]?m[1].replace(/\\s*\\|.*$/,''):c)||c;open('${origin}/jobs/new?role='+encodeURIComponent(r)+'&company='+encodeURIComponent(co)+'&url='+encodeURIComponent(u));})()`;
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <header className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-cyan/80">
          Tools
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-50">
          Send jobs to JobPilot
        </h1>
        <p className="text-sm text-slate-400">
          Install a bookmarklet — click it on any job posting to drop it into
          your review queue.
        </p>
      </header>

      <Card className="space-y-5 p-5">
        <div className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-slate-100">
            1 · Install
          </h2>
          <p className="text-sm text-slate-400">
            Drag this button onto your bookmarks bar:
          </p>
          <a
            href={snippet}
            data-testid="bookmarklet-link"
            className="inline-flex items-center gap-2 rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-2 text-sm font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/20"
          >
            <Bookmark className="h-4 w-4" />
            Send to JobPilot
          </a>
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-slate-100">
            2 · Use
          </h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-400">
            <li>Open any job posting (Greenhouse, Lever, a company site…).</li>
            <li>Click the bookmarklet.</li>
            <li>
              A JobPilot tab opens with the role, company, and URL pre-filled —
              just hit <span className="text-slate-200">Add to review queue</span>.
            </li>
          </ol>
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-slate-100">
            What it captures
          </h2>
          <p className="text-sm text-slate-400">
            The page title (e.g. “Senior Engineer – Acme Corp | Greenhouse”)
            is split into the role and company; the company falls back to the
            site&apos;s domain, and the full URL is saved with the job.
          </p>
        </div>
      </Card>

      <Card className="space-y-2 p-5">
        <h2 className="font-display text-lg font-semibold text-slate-100">
          The snippet
        </h2>
        <pre className="overflow-x-auto rounded-xl bg-ink-950/70 p-4 font-mono text-[11px] leading-relaxed text-neon-cyan/90">
          {snippet}
        </pre>
        <p className="text-xs text-slate-500">
          It points at this JobPilot origin (
          <code className="text-slate-400">{window.location.origin}</code>).
          If you run JobPilot on another port, open this page from there.
        </p>
      </Card>

      <Link
        to="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100"
      >
        <ExternalLink className="h-3.5 w-3.5" /> Back to Jobs
      </Link>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCreateJob } from '@/hooks/useCreateJob';
import type { NewApplicationInput } from '@/types';

const inputCls =
  'w-full rounded-xl border border-white/5 bg-ink-950/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 transition-colors focus:border-neon-cyan/40 focus:outline-none';

const labelCls =
  'block text-xs font-medium uppercase tracking-wider text-slate-500';

/**
 * Add a job you found anywhere (company careers page, LinkedIn, a friend's
 * tip) straight into the review queue — no engine run required.
 */
export default function JobNewPage() {
  const navigate = useNavigate();
  const create = useCreateJob();
  const [form, setForm] = useState<NewApplicationInput>({
    role: '',
    company: '',
    url: '',
    location: '',
    remote: true,
  });
  const patch = (p: Partial<NewApplicationInput>) =>
    setForm((f) => ({ ...f, ...p }));

  const valid = Boolean(
    form.role.trim() && form.company.trim() && form.url.trim(),
  );

  function submit() {
    if (!valid) return;
    create.mutate(
      {
        ...form,
        role: form.role.trim(),
        company: form.company.trim(),
        url: form.url.trim(),
        location: form.location?.trim() ?? '',
      },
      {
        onSuccess: () => navigate('/jobs'),
      },
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <Link
        to="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Jobs
      </Link>

      <header className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-cyan/80">
          Jobs
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-50">
          Add a job
        </h1>
        <p className="text-sm text-slate-400">
          Found a role the engine missed? Log it here — it lands in your review
          queue, ready to approve and apply.
        </p>
      </header>

      <Card className="space-y-4 p-5">
        <label className="space-y-1">
          <span className={labelCls}>Role title *</span>
          <input
            className={inputCls}
            value={form.role}
            onChange={(e) => patch({ role: e.target.value })}
            placeholder="e.g. Registered Nurse, Cardiologist, Product Designer"
          />
        </label>

        <label className="space-y-1">
          <span className={labelCls}>Company *</span>
          <input
            className={inputCls}
            value={form.company}
            onChange={(e) => patch({ company: e.target.value })}
            placeholder="e.g. Acme Health"
          />
        </label>

        <label className="space-y-1">
          <span className={labelCls}>Job posting URL *</span>
          <input
            className={inputCls}
            value={form.url}
            onChange={(e) => patch({ url: e.target.value })}
            placeholder="https://company.com/careers/…"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className={labelCls}>Location</span>
            <input
              className={inputCls}
              value={form.location}
              onChange={(e) => patch({ location: e.target.value })}
              placeholder="Remote, Berlin, US…"
            />
          </label>
          <label className="flex items-end gap-2 pb-2.5">
            <input
              type="checkbox"
              checked={form.remote ?? true}
              onChange={(e) => patch({ remote: e.target.checked })}
              className="h-4 w-4 accent-neon-cyan"
            />
            <span className="text-sm text-slate-300">Remote</span>
          </label>
        </div>

        {create.isError && (
          <p className="text-sm text-red-400">
            {(create.error as Error)?.message ?? 'Failed to add the job.'}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <Link to="/jobs">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button
            loading={create.isPending}
            disabled={!valid}
            leftIcon={<PlusCircle className="h-4 w-4" />}
            onClick={submit}
          >
            Add to review queue
          </Button>
        </div>
      </Card>

      <p className="font-mono text-[11px] text-slate-600">
        Manually-added jobs are marked “manual” and sit in the queue until you
        approve them.
      </p>
    </div>
  );
}

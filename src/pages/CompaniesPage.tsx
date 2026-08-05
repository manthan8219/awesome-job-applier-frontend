import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Globe, Plus, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DotBadge } from '@/components/ui/DotBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCompanies } from '@/hooks/useCompanies';
import { useSaveCompany } from '@/hooks/useSaveCompany';
import { useRefreshCompanies } from '@/hooks/useRefreshCompanies';
import { useCompanyJobs } from '@/hooks/useCompanyJobs';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';
import type { CompanyInput } from '@/types/companies';

const inputCls =
  'w-full rounded-xl border border-white/5 bg-ink-950/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 transition-colors focus:border-neon-cyan/40 focus:outline-none';

const EMPTY_FORM: CompanyInput = {
  name: '',
  website: '',
  boardURL: '',
  countries: '',
  ats: '',
};

function CompanyForm({
  initial,
  saving,
  onSave,
  onCancel,
}: {
  initial: CompanyInput;
  saving: boolean;
  onSave: (c: CompanyInput) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CompanyInput>({ ...initial });
  const patch = (p: Partial<CompanyInput>) => setForm((f) => ({ ...f, ...p }));
  const valid = form.name.trim().length > 0 && form.boardURL.trim().length > 0;
  return (
    <Card className="space-y-4 p-5">
      <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet/80">
        {initial.id ? 'Edit company' : 'Add company'}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            Company name *
          </span>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Stripe"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            Website
          </span>
          <input
            className={inputCls}
            value={form.website}
            onChange={(e) => patch({ website: e.target.value })}
            placeholder="https://stripe.com"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            ATS / careers URL *
          </span>
          <input
            className={inputCls}
            value={form.boardURL}
            onChange={(e) => patch({ boardURL: e.target.value })}
            placeholder="https://boards.greenhouse.io/stripe"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            Countries (comma: India, US)
          </span>
          <input
            className={inputCls}
            value={form.countries}
            onChange={(e) => patch({ countries: e.target.value })}
            placeholder="Remote, US"
          />
        </label>
      </div>
      <label className="space-y-1">
        <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
          ATS hint (greenhouse/lever) optional
        </span>
        <input
          className={inputCls}
          value={form.ats}
          onChange={(e) => patch({ ats: e.target.value })}
          placeholder="greenhouse"
        />
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          loading={saving}
          disabled={!valid}
          onClick={() => onSave(form)}
        >
          {initial.id ? 'Save' : 'Add company'}
        </Button>
      </div>
    </Card>
  );
}

function atsBadge(ats: string): { dot: string; badge: string } {
  if (!ats)
    return {
      dot: 'bg-slate-600',
      badge: 'bg-slate-600/10 text-slate-400 border-slate-600/30',
    };
  return {
    dot: 'bg-neon-violet',
    badge: 'bg-neon-violet/10 text-neon-violet border-neon-violet/30',
  };
}
function CompanyCard({
  name,
  ats,
  website,
  boardURL,
  hireCountries,
  industry,
  jobCount,
  updatedAt,
  selected,
  onSelect,
}: {
  name: string;
  ats: string;
  website: string;
  boardURL: string;
  hireCountries: string[];
  industry: string;
  jobCount: number;
  updatedAt: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const a = atsBadge(ats);
  return (
    <Card
      className={cn(
        'space-y-3 p-5 transition-all',
        selected && 'ring-1 ring-neon-cyan/40',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-display text-base font-semibold text-slate-100">
            {name}
          </h4>
          <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
            {boardURL || website}
          </p>
        </div>
        <DotBadge dot={a.dot} label={ats || 'unknown ATS'} badge={a.badge} />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
        {industry && (
          <span className="rounded-md bg-ink-700/60 px-2 py-0.5">
            {industry}
          </span>
        )}
        {hireCountries.map((c) => (
          <span key={c} className="rounded-md bg-ink-700/60 px-2 py-0.5">
            {c}
          </span>
        ))}
        <span>·</span>
        <span>
          {jobCount} scraped job{jobCount === 1 ? '' : 's'}
        </span>
        <span>·</span>
        <span>{formatRelativeTime(updatedAt)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onSelect}>
          {selected ? 'Hide jobs' : 'View jobs'}
        </Button>
        {website && (
          <a href={website} target="_blank" rel="noreferrer">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Globe className="h-3.5 w-3.5" />}
            >
              Site
            </Button>
          </a>
        )}
      </div>
    </Card>
  );
}

export default function CompaniesPage() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const { data, isLoading } = useCompanies(query, country);
  const save = useSaveCompany();
  const refresh = useRefreshCompanies();
  const { data: jobs, isLoading: jobsLoading } = useCompanyJobs(selected);

  const companies = data?.items ?? [];
  const counts = data?.counts ?? {};

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-cyan/80">
          Companies
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-50">
          Company index
        </h1>
        <p className="text-sm text-slate-400">
          ATS boards JobPilot watches. Search, add, or refresh from the network.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            className={cn(inputCls, 'pl-10')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="company / board / ats"
          />
        </div>
        <input
          className={cn(inputCls, 'w-44')}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="hire country — e.g. India"
        />
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setAdding((v) => !v)}
        >
          Add
        </Button>
        <Button
          variant="outline"
          size="sm"
          loading={refresh.isPending}
          leftIcon={
            <RefreshCw
              className={cn('h-4 w-4', refresh.isPending && 'animate-spin')}
            />
          }
          onClick={() => refresh.mutate()}
        >
          Refresh
        </Button>
      </div>

      {refresh.isSuccess && (
        <p className="font-mono text-xs text-emerald-400">
          ✓ refreshed — {refresh.data} companies upserted from network
        </p>
      )}

      {adding && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CompanyForm
            initial={EMPTY_FORM}
            saving={save.isPending}
            onCancel={() => setAdding(false)}
            onSave={(c) =>
              save.mutate(c, { onSuccess: () => setAdding(false) })
            }
          />
        </motion.div>
      )}

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="space-y-3 p-5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
            </Card>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="No companies"
            description={
              query || country
                ? 'No matches for your filters.'
                : 'Add a company or refresh from the network.'
            }
            className="py-16"
          />
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {companies.map((c) => {
            const key = c.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            return (
              <CompanyCard
                key={c.id}
                name={c.name}
                ats={c.ats}
                website={c.website}
                boardURL={c.boardURL}
                hireCountries={c.hireCountries}
                industry={c.industry}
                jobCount={counts[key] ?? 0}
                updatedAt={c.updatedAt}
                selected={selected === c.name}
                onSelect={() =>
                  setSelected((s) => (s === c.name ? null : c.name))
                }
              />
            );
          })}
        </div>
      )}

      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="space-y-3 p-5">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet/80">
              Scraped jobs · {selected}
            </h3>
            {jobsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : jobs && jobs.length > 0 ? (
              <ul className="divide-y divide-white/5">
                {jobs.map((j) => (
                  <li
                    key={j.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span className="truncate text-slate-200">{j.role}</span>
                    <span className="font-mono text-xs text-slate-500">
                      {j.status} · {j.fitScore || '—'}/100
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">
                No scraped jobs recorded for this company yet.
              </p>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}

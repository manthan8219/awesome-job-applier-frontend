import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Save, Search, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSearchContacts } from '@/hooks/useSearchContacts';
import { useSavedContacts } from '@/hooks/useSavedContacts';
import { useSaveContact } from '@/hooks/useSaveContact';
import { useDeleteContact } from '@/hooks/useDeleteContact';
import { cn } from '@/lib/utils';
import type { OsintContact } from '@/types/contacts';

const inputCls =
  'w-full rounded-xl border border-white/5 bg-ink-950/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 transition-colors focus:border-neon-cyan/40 focus:outline-none';

function emailTypeBadge(t: string): {
  dot: string;
  badge: string;
  label: string;
} {
  switch (t) {
    case 'work':
      return {
        dot: 'bg-emerald-400',
        badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
        label: 'W',
      };
    case 'personal':
      return {
        dot: 'bg-neon-amber',
        badge: 'bg-neon-amber/10 text-neon-amber border-neon-amber/30',
        label: 'P',
      };
    default:
      return {
        dot: 'bg-slate-500',
        badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        label: '~',
      };
  }
}

function ContactRow({
  c,
  saved,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  c: OsintContact;
  saved?: boolean;
  onSave?: (c: OsintContact) => void;
  onDelete?: (id: number) => void;
  saving?: boolean;
  deleting?: boolean;
}) {
  const t = emailTypeBadge(c.emailType);
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-slate-100">
            {c.name || '(unknown)'}
          </span>
          {c.title && (
            <span className="truncate text-xs text-slate-500">· {c.title}</span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
          <span className="font-mono">{c.email || c.linkedIn || '—'}</span>
          <span>·</span>
          <span>{c.source}</span>
          {c.confidence > 0 && (
            <>
              <span>·</span>
              <span className="font-mono">{c.confidence}%</span>
            </>
          )}
        </div>
        {c.notes && (
          <p className="mt-0.5 truncate text-[11px] text-slate-600">
            {c.notes}
          </p>
        )}
      </div>
      <span
        className={cn(
          'grid h-5 w-5 shrink-0 place-items-center rounded text-[10px] font-bold',
          t.badge,
        )}
      >
        {t.label}
      </span>
      {onSave && !saved && (
        <Button
          variant="ghost"
          size="sm"
          loading={saving}
          leftIcon={<Save className="h-3.5 w-3.5" />}
          onClick={() => onSave(c)}
        >
          Save
        </Button>
      )}
      {saved && onDelete && (
        <Button
          variant="ghost"
          size="sm"
          loading={deleting}
          leftIcon={<Trash2 className="h-3.5 w-3.5" />}
          onClick={() => onDelete(c.id)}
          className="text-red-400 hover:text-red-300"
        />
      )}
    </div>
  );
}
export default function ContactsPage() {
  const [sub, setSub] = useState<'search' | 'saved'>('search');
  const [company, setCompany] = useState('');
  const [domain, setDomain] = useState('');

  const search = useSearchContacts();
  const saved = useSavedContacts();
  const saveContact = useSaveContact();
  const delContact = useDeleteContact();

  const savedEmails = new Set((saved.data ?? []).map((c) => c.email));
  const results = search.data?.contacts ?? [];

  function runSearch() {
    if (!company.trim()) return;
    search.mutate({ company: company.trim(), domain: domain.trim() });
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <header className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-cyan/80">
          Contacts
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-50">
          HR contact finder
        </h1>
        <p className="text-sm text-slate-400">
          OSINT search across Hunter, Apollo, GitHub, and pattern emails — then
          save the good ones.
        </p>
      </header>

      <div className="flex items-center gap-2">
        {(['search', 'saved'] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={sub === s}
            onClick={() => setSub(s)}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-xs font-medium transition-all',
              sub === s
                ? 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan'
                : 'border-white/5 bg-ink-800/40 text-slate-400 hover:bg-white/5',
            )}
          >
            {s === 'search'
              ? 'Search'
              : `Saved${saved.data?.length ? ` (${saved.data.length})` : ''}`}
          </button>
        ))}
      </div>

      {sub === 'search' ? (
        <div className="space-y-5">
          <Card className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
                  Company
                </span>
                <input
                  className={inputCls}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Linear, Vercel, Stripe"
                />
              </label>
              <label className="space-y-1">
                <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
                  Domain (optional)
                </span>
                <input
                  className={inputCls}
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. linear.app"
                />
              </label>
            </div>
            <Button
              leftIcon={<Search className="h-4 w-4" />}
              loading={search.isPending}
              disabled={!company.trim()}
              onClick={runSearch}
            >
              Search contacts
            </Button>
            {search.isError && (
              <p className="text-sm text-red-400">
                {(search.error as Error)?.message ?? 'search failed'}
              </p>
            )}
          </Card>

          {search.isPending && (
            <Card className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </Card>
          )}

          {!search.isPending && results.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="divide-y divide-white/5 p-2">
                {results.map((c) => (
                  <ContactRow
                    key={`${c.email}-${c.id}`}
                    c={c}
                    saved={savedEmails.has(c.email)}
                    saving={saveContact.isPending}
                    onSave={(contact) => saveContact.mutate(contact)}
                  />
                ))}
              </Card>
            </motion.div>
          )}

          {!search.isPending && search.data && results.length === 0 && (
            <Card>
              <EmptyState
                icon={Users}
                title="No contacts found"
                description="Try a different company or add a domain."
                className="py-16"
              />
            </Card>
          )}
        </div>
      ) : (
        <Card className="divide-y divide-white/5 p-2">
          {saved.isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (saved.data ?? []).length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No saved contacts yet"
              description="Search first, then save a contact."
              className="py-16"
            />
          ) : (
            (saved.data ?? []).map((c) => (
              <ContactRow
                key={c.id}
                c={c}
                saved
                deleting={delContact.isPending}
                onDelete={(id) => delContact.mutate(id)}
              />
            ))
          )}
        </Card>
      )}
    </div>
  );
}

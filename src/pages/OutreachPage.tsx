import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Mail,
  Linkedin,
  Send,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DotBadge } from '@/components/ui/DotBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useOutreachItems } from '@/hooks/useOutreachItems';
import { useOutreachSetup } from '@/hooks/useOutreachSetup';
import { useSaveOutreachSetup } from '@/hooks/useSaveOutreachSetup';
import { useBuildOutreachQueue } from '@/hooks/useBuildOutreachQueue';
import { useSendOutreachItem } from '@/hooks/useSendOutreachItem';
import { useOutreachLog } from '@/hooks/useOutreachLog';
import { OUTREACH_STATUS_META } from '@/constants';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';
import type {
  OutreachChannel,
  OutreachItem,
  OutreachMode,
  OutreachSetup,
} from '@/types/outreach';

const inputCls =
  'w-full rounded-xl border border-white/5 bg-ink-950/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 transition-colors focus:border-neon-cyan/40 focus:outline-none';

const MODES: { value: OutreachMode; label: string; hint: string }[] = [
  { value: 'confirm', label: 'Confirm', hint: 'Ask before each send' },
  { value: 'queue', label: 'Queue', hint: 'Each click fires the next' },
  { value: 'auto', label: 'Auto', hint: 'Run the whole queue' },
];

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
            'absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white transition-all',
            value ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  );
}

function SetupSub({
  setup,
  saving,
  onSave,
}: {
  setup: OutreachSetup;
  saving: boolean;
  onSave: (s: OutreachSetup) => void;
}) {
  const [form, setForm] = useState<OutreachSetup>({ ...setup });
  const patch = (p: Partial<OutreachSetup>) => setForm((f) => ({ ...f, ...p }));
  return (
    <Card className="space-y-4 p-5">
      <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet/80">
        Setup
      </h3>
      <Toggle
        label="Opt in to outreach"
        value={form.consent}
        onChange={(v) => patch({ consent: v })}
      />
      <div className="space-y-1.5">
        <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
          Automation mode
        </span>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => patch({ mode: m.value })}
              className={cn(
                'rounded-xl border px-3 py-2 text-left transition-all',
                form.mode === m.value
                  ? 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan'
                  : 'border-white/5 bg-ink-800/40 text-slate-400 hover:bg-white/5',
              )}
            >
              <span className="block text-xs font-medium">{m.label}</span>
              <span className="block text-[10px] text-slate-500">{m.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            Max emails / day
          </span>
          <input
            type="number"
            min={0}
            className={inputCls}
            value={form.maxEmailsPerDay}
            onChange={(e) => patch({ maxEmailsPerDay: Number(e.target.value) })}
          />
        </label>
        <label className="space-y-1">
          <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            Max LinkedIn / day
          </span>
          <input
            type="number"
            min={0}
            className={inputCls}
            value={form.maxLinkedInPerDay}
            onChange={(e) =>
              patch({ maxLinkedInPerDay: Number(e.target.value) })
            }
          />
        </label>
      </div>
      <div className="space-y-2.5">
        <Toggle
          label="AI composes outreach"
          value={form.aiCompose}
          onChange={(v) => patch({ aiCompose: v })}
        />
        <Toggle
          label="AI reviews before send"
          value={form.aiReview}
          onChange={(v) => patch({ aiReview: v })}
        />
      </div>
      <div className="space-y-2.5 border-t border-white/5 pt-3">
        <Toggle
          label="Referral-ask variant"
          value={form.referralAsk}
          onChange={(v) => patch({ referralAsk: v })}
        />
        <p className="text-xs text-slate-500">
          Switches email drafts to a warm referral ask — "know who owns
          hiring?" — instead of a self pitch. Same consent, caps and
          reply-check as regular email.
        </p>
        {form.referralAsk && (
          <>
            <label className="space-y-1">
              <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
                Referral subject template
              </span>
              <input
                className={inputCls}
                value={form.referralSubjectTpl ?? ''}
                onChange={(e) => patch({ referralSubjectTpl: e.target.value })}
                placeholder="Referral — {{role}} at {{company}}"
              />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
                Referral body template
              </span>
              <textarea
                className={cn(inputCls, 'h-auto resize-y')}
                rows={3}
                value={form.referralBodyTpl ?? ''}
                onChange={(e) => patch({ referralBodyTpl: e.target.value })}
                placeholder="Hi {{contact_name}} — I applied for {{role}} at {{company}}. Would appreciate any referral or tip on the hiring process. Thanks!"
              />
            </label>
          </>
        )}
      </div>
      <div className="flex justify-end">
        <Button size="sm" loading={saving} onClick={() => onSave(form)}>
          Save setup
        </Button>
      </div>
    </Card>
  );
}
function ChannelSub({
  channel,
  items,
  build,
  send,
}: {
  channel: OutreachChannel;
  items: OutreachItem[];
  build: ReturnType<typeof useBuildOutreachQueue>;
  send: ReturnType<typeof useSendOutreachItem>;
}) {
  const isEmail = channel === 'email';
  const Icon = isEmail ? Mail : Linkedin;
  const pending = items.filter(
    (i) =>
      i.status === 'draft' ||
      i.status === 'ready' ||
      i.status === 'finding' ||
      i.status === 'drafting',
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neon-cyan/80">
            {isEmail ? 'Email' : 'LinkedIn'}
          </p>
          <p className="text-sm text-slate-400">
            {isEmail
              ? 'Hunter finds To: addresses; AI drafts.'
              : 'Open roles and connect with recruiters.'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          loading={build.isPending}
          leftIcon={<Wand2 className="h-4 w-4" />}
          onClick={() => build.mutate(channel)}
        >
          Build {isEmail ? 'email' : 'LinkedIn'} queue
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon={Icon}
            title={`No ${isEmail ? 'email' : 'LinkedIn'} items yet`}
            description={`Press Build ${isEmail ? 'email' : 'LinkedIn'} queue — Nexus drafts from your applied jobs.`}
            className="py-16"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const m = OUTREACH_STATUS_META[it.status];
            const canSend = it.status === 'draft' || it.status === 'ready';
            return (
              <Card key={it.id} className="space-y-2.5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-100">
                        {it.company}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="truncate text-sm text-slate-300">
                        {it.role}
                      </span>
                    </div>
                    {(it.contactEmail || it.contactName || it.linkedInURL) && (
                      <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
                        {it.contactEmail || it.contactName || it.linkedInURL}
                      </p>
                    )}
                  </div>
                  <DotBadge dot={m.dot} label={m.label} badge={m.badge} />
                </div>
                {isEmail && it.subject && (
                  <p className="text-xs font-medium text-slate-300">
                    {it.subject}
                  </p>
                )}
                <p
                  className={cn(
                    'whitespace-pre-line text-xs leading-relaxed text-slate-400',
                    isEmail ? '' : 'italic',
                  )}
                >
                  {it.body}
                </p>
                {it.error && (
                  <p className="text-xs text-red-400">⚠ {it.error}</p>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    variant={canSend ? 'primary' : 'secondary'}
                    size="sm"
                    loading={send.isPending}
                    disabled={!canSend}
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                    onClick={() => send.mutate(it.id)}
                  >
                    {isEmail
                      ? canSend
                        ? 'Send'
                        : 'Sent'
                      : canSend
                        ? 'Open'
                        : 'Opened'}
                  </Button>
                  {it.sentAt && (
                    <span className="font-mono text-[11px] text-slate-600">
                      {formatRelativeTime(it.sentAt)}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
          <p className="font-mono text-[11px] text-slate-600">
            {pending.length} pending · {items.length - pending.length} done
          </p>
        </div>
      )}
    </div>
  );
}

function SentSub() {
  const { data, isLoading } = useOutreachLog();
  const entries = data ?? [];
  return (
    <Card className="space-y-3 p-5">
      <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet/80">
        Sent outreach
      </h3>
      <p className="text-sm text-slate-400">
        Audit log of every email sent and LinkedIn action taken by Nexus.
      </p>
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No sent outreach yet"
          description="Send emails or open LinkedIn from the Email / LinkedIn tabs."
          className="py-12"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium">Channel</th>
                <th className="py-2 pr-3 font-medium">Contact</th>
                <th className="py-2 pr-3 font-medium">Company / Role</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {entries.map((e) => (
                <tr key={e.id} className="text-slate-300">
                  <td className="py-2 pr-3 font-mono text-xs text-slate-400">
                    {e.sentAt ? formatRelativeTime(e.sentAt) : '—'}
                  </td>
                  <td className="py-2 pr-3 capitalize">{e.channel}</td>
                  <td className="py-2 pr-3">
                    {e.contactName || e.contactEmail || '—'}
                  </td>
                  <td className="py-2 pr-3">
                    {e.company}
                    {e.role ? ` · ${e.role}` : ''}
                  </td>
                  <td className="py-2 capitalize">{e.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function OutreachPage() {
  const [sub, setSub] = useState<'setup' | 'email' | 'linkedin' | 'sent'>(
    'setup',
  );

  const { data: setup, isLoading: setupLoading } = useOutreachSetup();
  const saveSetup = useSaveOutreachSetup();
  const { data: items, isLoading: itemsLoading } = useOutreachItems();
  const build = useBuildOutreachQueue();
  const send = useSendOutreachItem();

  const emailItems = (items ?? []).filter((i) => i.channel === 'email');
  const liItems = (items ?? []).filter((i) => i.channel === 'linkedin');

  const tabs: {
    value: 'setup' | 'email' | 'linkedin' | 'sent';
    label: string;
    count?: number;
  }[] = [
    { value: 'setup', label: 'Setup' },
    { value: 'email', label: 'Email', count: emailItems.length },
    { value: 'linkedin', label: 'LinkedIn', count: liItems.length },
    { value: 'sent', label: 'Sent' },
  ];

  const consent = setup?.consent ?? false;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <header className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-cyan/80">
          Outreach
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-50">
          Recruiter outreach
        </h1>
        <p className="text-sm text-slate-400">
          Build email + LinkedIn queues from your applied jobs, then send with
          consent and caps.
        </p>
      </header>

      {!consent && sub !== 'setup' && (
        <div className="flex items-center gap-3 rounded-xl border border-neon-amber/20 bg-neon-amber/5 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-neon-amber" />
          <p className="text-sm text-neon-amber/90">
            Outreach is opt-in. Turn it on in Setup first.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-pressed={sub === t.value}
            onClick={() => setSub(t.value)}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-xs font-medium transition-all',
              sub === t.value
                ? 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan'
                : 'border-white/5 bg-ink-800/40 text-slate-400 hover:bg-white/5',
            )}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1.5 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {sub === 'setup' &&
        (setupLoading || !setup ? (
          <Card className="space-y-3 p-5">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SetupSub
              setup={setup}
              saving={saveSetup.isPending}
              onSave={(s) => saveSetup.mutate(s)}
            />
          </motion.div>
        ))}

      {sub === 'email' &&
        (itemsLoading ? (
          <Card className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </Card>
        ) : (
          <ChannelSub
            channel="email"
            items={emailItems}
            build={build}
            send={send}
          />
        ))}

      {sub === 'linkedin' &&
        (itemsLoading ? (
          <Card className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </Card>
        ) : (
          <ChannelSub
            channel="linkedin"
            items={liItems}
            build={build}
            send={send}
          />
        ))}

      {sub === 'sent' && <SentSub />}

      {build.isPending && (
        <Card className="flex items-center gap-3 p-5">
          <Sparkles className="h-5 w-5 shrink-0 animate-pulse-glow text-neon-cyan" />
          <p className="font-mono text-sm text-slate-300">
            Finding contacts + drafting outreach…
          </p>
        </Card>
      )}
    </div>
  );
}

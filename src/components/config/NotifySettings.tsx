import { BarChart3, CheckCircle2, Send, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNotifyChannels } from '@/hooks/useNotifyChannels';
import { useSendNotifySummary } from '@/hooks/useSendNotifySummary';
import { useTestNotification } from '@/hooks/useTestNotification';
import type { NotifyChannel } from '@/types/notifications';

/** Friendly labels for the known channel ids (backend also sends a display name). */
const CHANNEL_LABELS: Record<string, string> = {
  discord: 'Discord',
  telegram: 'Telegram',
  email: 'Email',
};

function channelLabel(channel: NotifyChannel): string {
  return CHANNEL_LABELS[channel.id] ?? channel.name;
}

/**
 * Notifications card content — lists the configured notification channels
 * (Discord / Telegram / Email) and sends a test notification to all of them.
 */
export function NotifySettings() {
  const channels = useNotifyChannels();
  const test = useTestNotification();
  const summary = useSendNotifySummary();

  const enabled = (channels.data ?? []).filter((c) => c.enabled);
  const hasChannels = enabled.length > 0;
  const ready = !channels.isPending && !channels.isError;

  return (
    <div className="space-y-4">
      {channels.isPending ? (
        <Skeleton className="h-10 w-full" />
      ) : channels.isError ? (
        <p className="text-sm text-red-400">
          Could not load notification channels:{' '}
          {channels.error?.message ?? 'unknown error'}
        </p>
      ) : hasChannels ? (
        <div className="flex flex-wrap items-center gap-2">
          {enabled.map((c) => (
            <Badge
              key={c.id}
              className="border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
            >
              <CheckCircle2 className="h-3 w-3" />
              {channelLabel(c)}
            </Badge>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 bg-ink-950/40 px-4 py-3 text-sm text-slate-400">
          No notification channels configured — add Discord webhook, Telegram
          bot, or Gmail app password in Config.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Send className="h-3.5 w-3.5" />}
          loading={test.isPending}
          disabled={!ready || !hasChannels}
          onClick={() => test.mutate()}
        >
          Send test notification
        </Button>
        {test.isSuccess && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Sent to {test.data.sent} channel(s)
          </span>
        )}
        {test.isError && (
          <span className="flex items-center gap-1.5 text-xs text-red-400">
            <XCircle className="h-3.5 w-3.5" />
            {test.error instanceof Error ? test.error.message : 'Test failed'}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<BarChart3 className="h-3.5 w-3.5" />}
          loading={summary.isPending}
          disabled={!ready || !hasChannels}
          onClick={() => summary.mutate()}
        >
          Send run summary
        </Button>
        {summary.isSuccess && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Digest sent to {summary.data.sent} channel(s)
          </span>
        )}
        {summary.isError && (
          <span className="flex items-center gap-1.5 text-xs text-red-400">
            <XCircle className="h-3.5 w-3.5" />
            {summary.error instanceof Error
              ? summary.error.message
              : 'Summary failed'}
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Test notifications and run-summary digests are sent to every configured
        channel by the backend.
      </p>
    </div>
  );
}

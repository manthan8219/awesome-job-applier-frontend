import { useCallback, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { PageLoader } from '@/components/ui/PageLoader';
import { Card } from '@/components/ui/Card';
import { TodayCard } from '@/components/dashboard/TodayCard';
import { OnboardingCard } from '@/components/dashboard/OnboardingCard';
import { ModeCard } from '@/components/dashboard/ModeCard';
import { NextAction } from '@/components/dashboard/NextAction';
import { ProvidersGrid } from '@/components/dashboard/ProvidersGrid';
import { LiveFeed } from '@/components/dashboard/LiveFeed';
import { RecentApplications } from '@/components/dashboard/RecentApplications';
import { RunSummaryBanner } from '@/components/dashboard/RunSummaryBanner';
import { StaleNudge } from '@/components/dashboard/StaleNudge';
import { NextRunCard } from '@/components/dashboard/NextRunCard';
import { SectionLabel } from '@/components/dashboard/SectionLabel';
import { OutcomeFunnel } from '@/components/jobs/OutcomeFunnel';
import { useMission } from '@/hooks/useMission';
import { useStartRun } from '@/hooks/useStartRun';
import { useStopRun } from '@/hooks/useStopRun';
import { useToggleDryRun } from '@/hooks/useToggleDryRun';
import { useToggleAutoApply } from '@/hooks/useToggleAutoApply';
import { useApplications } from '@/hooks/useApplications';
import { useConfig } from '@/hooks/useConfig';
import { useSetOutcome } from '@/hooks/useSetOutcome';
import { localDayKey, shouldFireDailyRun } from '@/lib/schedule';

export default function DashboardPage() {
  const { data: m, isLoading } = useMission();
  const startRun = useStartRun();
  const stopRun = useStopRun();
  const toggleDryRun = useToggleDryRun();
  const toggleAutoApply = useToggleAutoApply();
  const { data } = useApplications('');
  const { data: cfg } = useConfig();
  const setOutcome = useSetOutcome();
  const lastFiredDay = useRef('');

  const running = m?.engineStatus === 'running';
  const apps = useMemo(() => data ?? [], [data]);

  // Stable handlers so memoized children (ModeCard, StaleNudge) skip renders
  // when only the live feed changed.
  const onToggleDryRun = useCallback(() => {
    toggleDryRun.mutate(!m?.dryRun);
  }, [toggleDryRun, m?.dryRun]);
  const onToggleAutoApply = useCallback(() => {
    toggleAutoApply.mutate(!m?.autoApply);
  }, [toggleAutoApply, m?.autoApply]);
  const onStart = useCallback(() => {
    startRun.mutate({
      dryRun: m?.dryRun ?? false,
      autoApply: !!(m?.autoApply && m?.hasConsent),
    });
  }, [startRun, m?.dryRun, m?.autoApply, m?.hasConsent]);
  const onStop = useCallback(() => stopRun.mutate(), [stopRun]);
  const onMarkGhosted = useCallback(
    (ids: number[]) => {
      for (const id of ids) setOutcome.mutate({ id, outcome: 'ghosted' });
    },
    [setOutcome],
  );

  // While the dashboard is open, run one safe dry-run per day at the
  // configured time (never auto-applies — consent untouched).
  useEffect(() => {
    const at = cfg?.dailyRunAt;
    if (!cfg?.dailyRunEnabled || !at || running) return;
    const id = window.setInterval(() => {
      const now = new Date();
      if (shouldFireDailyRun(at, now, lastFiredDay.current)) {
        lastFiredDay.current = localDayKey(now);
        startRun.mutate({ dryRun: true, autoApply: false });
      }
    }, 30_000);
    return () => window.clearInterval(id);
  }, [cfg?.dailyRunEnabled, cfg?.dailyRunAt, running, startRun]);

  if (isLoading || !m) return <PageLoader label="Connecting to Mission Control" />;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-cyan/80">
          Mission Control
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-50">
          Your job-hunt command center
        </h1>
        <p className="text-sm text-slate-400">
          Ready check, then one action — search 9 boards, score, and apply.
        </p>
      </header>

      <RunSummaryBanner snapshot={m} />
      <NextAction text={m.nextAction} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <TodayCard
            applied={m.applied}
            skipped={m.skipped}
            failed={m.failed}
            appliedToday={m.appliedToday}
            maxPerDay={m.maxPerDay}
            resumePath={m.resumePath}
          />
          <ProvidersGrid
            providers={m.providers}
            progress={m.progress}
            engineStatus={m.engineStatus}
          />
          <LiveFeed
            foundCount={m.foundCount}
            liveFeed={m.liveFeed}
            engineStatus={m.engineStatus}
          />
        </div>

        <div className="space-y-5">
          <ModeCard
            engineStatus={m.engineStatus}
            modeName={m.modeName}
            modeHint={m.modeHint}
            dryRun={m.dryRun}
            autoApply={m.autoApply}
            hasConsent={m.hasConsent}
            errMsg={m.errMsg}
            startPending={startRun.isPending}
            onToggleDryRun={onToggleDryRun}
            onToggleAutoApply={onToggleAutoApply}
            onStart={onStart}
            onStop={onStop}
          />
          <OnboardingCard
            checks={m.checks}
            onboardingComplete={m.onboardingComplete}
          />
          <Card className="p-4">
            <SectionLabel>Pipeline</SectionLabel>
            <div className="mt-3">
              <OutcomeFunnel apps={apps} />
            </div>
          </Card>
          <StaleNudge apps={apps} onMarkGhosted={onMarkGhosted} />
          <NextRunCard
            enabled={cfg?.dailyRunEnabled ?? false}
            at={cfg?.dailyRunAt}
          />
          <RecentApplications
            recent={m.recent}
            lastJob={m.lastJob}
            engineStatus={m.engineStatus}
          />
        </div>
      </div>

      {running && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 py-2 font-mono text-xs text-slate-500"
        >
          engine live · auto-refreshing
        </motion.div>
      )}
    </div>
  );
}

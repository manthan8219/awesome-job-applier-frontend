import { motion } from 'framer-motion';
import { PageLoader } from '@/components/ui/PageLoader';
import { TodayCard } from '@/components/dashboard/TodayCard';
import { OnboardingCard } from '@/components/dashboard/OnboardingCard';
import { ModeCard } from '@/components/dashboard/ModeCard';
import { NextAction } from '@/components/dashboard/NextAction';
import { ProvidersGrid } from '@/components/dashboard/ProvidersGrid';
import { LiveFeed } from '@/components/dashboard/LiveFeed';
import { RecentApplications } from '@/components/dashboard/RecentApplications';
import { useMission } from '@/hooks/useMission';
import { useStartRun } from '@/hooks/useStartRun';
import { useStopRun } from '@/hooks/useStopRun';
import { useToggleDryRun } from '@/hooks/useToggleDryRun';
import { useToggleAutoApply } from '@/hooks/useToggleAutoApply';

export default function DashboardPage() {
  const { data: m, isLoading } = useMission();
  const startRun = useStartRun();
  const stopRun = useStopRun();
  const toggleDryRun = useToggleDryRun();
  const toggleAutoApply = useToggleAutoApply();

  if (isLoading || !m) return <PageLoader label="Connecting to Mission Control" />;

  const running = m.engineStatus === 'running';

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
            onToggleDryRun={() => toggleDryRun.mutate(!m.dryRun)}
            onToggleAutoApply={() => toggleAutoApply.mutate(!m.autoApply)}
            onStart={() =>
              startRun.mutate({ dryRun: m.dryRun, autoApply: m.autoApply && m.hasConsent })
            }
            onStop={() => stopRun.mutate()}
          />
          <OnboardingCard
            checks={m.checks}
            onboardingComplete={m.onboardingComplete}
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

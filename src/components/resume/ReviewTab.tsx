import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { SectionHeading } from './SectionHeading';
import { ScoreBar } from './ScoreBar';
import { useReanalyzeResume } from '@/hooks/useReanalyzeResume';
import { useResumeAnalysis } from '@/hooks/useResumeAnalysis';
import { cn } from '@/lib/utils';
import type { ResumeProfile } from '@/types/resume';

function Chip({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-lg border border-neon-violet/20 bg-neon-violet/10 px-2.5 py-1 text-xs font-medium text-neon-violet">
      {children}
    </span>
  );
}

function ListColumn({
  title,
  tone,
  items,
  icon: Icon,
}: {
  title: string;
  tone: string;
  items: string[];
  icon: typeof CheckCircle2;
}) {
  return (
    <div className="space-y-2">
      <SectionHeading>{title}</SectionHeading>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={`${title}-${i}`} className="flex items-start gap-2">
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone)} />
            <span className="text-sm text-slate-300">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProfileBody({ profile }: { profile: ResumeProfile }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <Card className="space-y-3 p-5">
        <SectionHeading>AI Summary</SectionHeading>
        <p className="text-sm leading-relaxed text-slate-200">
          {profile.summary}
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-md bg-ink-700/60 px-2 py-1 font-mono capitalize">
            {profile.experienceLevel}
          </span>
          <span className="rounded-md bg-ink-700/60 px-2 py-1 font-mono">
            ~{profile.yearsEstimate} yrs
          </span>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="space-y-3 p-5">
          <ListColumn
            title="What's good"
            tone="text-emerald-400"
            items={profile.whatsGood}
            icon={CheckCircle2}
          />
        </Card>
        <Card className="space-y-3 p-5">
          <ListColumn
            title="What's wrong"
            tone="text-red-400"
            items={profile.whatsWrong}
            icon={XCircle}
          />
        </Card>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="space-y-3 p-5">
          <SectionHeading>Strengths</SectionHeading>
          <div className="space-y-2.5">
            {profile.strengthScores.slice(0, 5).map((s) => (
              <ScoreBar key={s.name} item={s} />
            ))}
          </div>
        </Card>
        <Card className="space-y-3 p-5">
          <SectionHeading>Role fit</SectionHeading>
          <div className="space-y-2.5">
            {profile.roleFit.slice(0, 5).map((s) => (
              <ScoreBar key={s.name} item={s} />
            ))}
          </div>
        </Card>
        <Card className="space-y-3 p-5">
          <SectionHeading>Skill scores</SectionHeading>
          <div className="space-y-2.5">
            {profile.skillScores.slice(0, 6).map((s) => (
              <ScoreBar key={s.name} item={s} />
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="space-y-3 p-5">
          <SectionHeading>Suitable roles</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {profile.suitableRoles.map((r) => (
              <Chip key={r}>{r}</Chip>
            ))}
          </div>
        </Card>
        <Card className="space-y-3 p-5">
          <SectionHeading>Industries</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {profile.industries.map((r) => (
              <Chip key={r}>{r}</Chip>
            ))}
          </div>
        </Card>
      </div>

      <Card className="space-y-3 p-5">
        <SectionHeading>How to fix it</SectionHeading>
        <ol className="space-y-2.5">
          {profile.improvements.map((tip, i) => (
            <li key={`tip-${i}`} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-neon-amber/10 text-[11px] font-bold text-neon-amber">
                {i + 1}
              </span>
              <span className="text-sm text-slate-200">{tip}</span>
            </li>
          ))}
        </ol>
      </Card>
    </motion.div>
  );
}

export function ReviewTab() {
  const { data, isLoading, isError, error } = useResumeAnalysis();
  const reanalyze = useReanalyzeResume();
  const analyzing = reanalyze.isPending;

  const profile = data?.profile ?? null;
  const ready = Boolean(data?.valid && profile && !profile.error);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neon-cyan/80">
            Step 1 — Review
          </p>
          <p className="text-sm text-slate-400">
            Read this first. Then add the work your resume underplays.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={
            <RefreshCw className={cn('h-4 w-4', analyzing && 'animate-spin')} />
          }
          loading={analyzing}
          disabled={isLoading || analyzing}
          onClick={() => reanalyze.mutate()}
        >
          Re-analyze
        </Button>
      </div>

      {data?.message && (
        <p className="font-mono text-xs text-slate-500">{data.message}</p>
      )}

      {isLoading && (
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="space-y-3 p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full" />
          </Card>
          <Card className="space-y-3 p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full" />
          </Card>
        </div>
      )}

      {isError && (
        <Card className="flex items-center gap-3 p-5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <p className="text-sm text-red-300">
            Could not load analysis:{' '}
            {(error as Error)?.message ?? 'unknown error'}
          </p>
        </Card>
      )}

      {analyzing && (
        <Card className="flex items-center gap-3 p-5">
          <Lightbulb className="h-5 w-5 shrink-0 animate-pulse-glow text-neon-amber" />
          <p className="font-mono text-sm text-slate-300">
            AI is reading your resume…
          </p>
        </Card>
      )}

      {!isLoading && !isError && !ready && (
        <Card>
          <EmptyState
            icon={Lightbulb}
            title="Nothing here yet"
            description="Go to Config → turn on AI Assist → set your Resume Path, then come back here and hit Re-analyze."
            className="py-16"
          />
        </Card>
      )}

      {ready && profile && <ProfileBody profile={profile} />}
    </div>
  );
}

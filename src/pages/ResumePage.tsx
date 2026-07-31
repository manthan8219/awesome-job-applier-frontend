import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StepStrip, type ResumeStep } from '@/components/resume/StepStrip';
import { ReviewTab } from '@/components/resume/ReviewTab';
import { WorkTab } from '@/components/resume/WorkTab';
import { ImproveTab } from '@/components/resume/ImproveTab';
import { SkillsTab } from '@/components/resume/SkillsTab';
import { useResumeAnalysis } from '@/hooks/useResumeAnalysis';
import { useResumeProjects } from '@/hooks/useResumeProjects';
import { useResumeSkills } from '@/hooks/useResumeSkills';

const STEP_LABELS = ['Review', 'Your work', 'New resume', 'Skills'] as const;

export default function ResumePage() {
  const [active, setActive] = useState(0);

  const { data: analysis } = useResumeAnalysis();
  const { data: projects } = useResumeProjects();
  const { data: skills } = useResumeSkills();

  const profile = analysis?.profile ?? null;
  const steps: ResumeStep[] = [
    {
      index: 0,
      label: STEP_LABELS[0],
      done: Boolean(analysis?.valid && profile && !profile.error),
    },
    { index: 1, label: STEP_LABELS[1], done: (projects?.length ?? 0) >= 1 },
    { index: 2, label: STEP_LABELS[2], done: false },
    { index: 3, label: STEP_LABELS[3], done: (skills?.length ?? 0) > 0 },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-cyan/80">
          Resume Studio
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-50">
          Build a stronger resume
        </h1>
        <p className="text-sm text-slate-400">
          Four steps. Finish them in order — review, your work, a new resume,
          your skills.
        </p>
      </header>

      <StepStrip steps={steps} active={active} onSelect={setActive} />

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {active === 0 && <ReviewTab />}
          {active === 1 && <WorkTab />}
          {active === 2 && <ImproveTab />}
          {active === 3 && <SkillsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

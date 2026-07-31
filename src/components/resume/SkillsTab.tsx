import { CheckCircle2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { SectionHeading } from './SectionHeading';
import { TagInput } from '@/components/config/TagInput';
import { useResumeSkills } from '@/hooks/useResumeSkills';
import { useSaveResumeSkills } from '@/hooks/useSaveResumeSkills';

export function SkillsTab() {
  const { data, isLoading } = useResumeSkills();
  const save = useSaveResumeSkills();
  const skills = data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neon-cyan/80">
          Step 4 — Skills
        </p>
        <p className="text-sm text-slate-400">
          Skills injected into every resume generation run.
        </p>
      </div>

      <Card className="space-y-4 p-5">
        <SectionHeading
          action={
            save.isPending ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-neon-cyan">
                <Loader2 className="h-3 w-3 animate-spin" /> saving
              </span>
            ) : save.isError ? (
              <span className="text-[11px] text-red-400">save failed</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> saved
              </span>
            )
          }
        >
          Your skills
        </SectionHeading>

        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <TagInput
            tags={skills}
            onTagsChange={(t) => save.mutate(t)}
            placeholder="Type a skill and press Enter…"
          />
        )}

        <p className="text-xs text-slate-500">
          Add skills one at a time with Enter, or remove with the ×. Changes
          persist to your config.
        </p>
      </Card>
    </div>
  );
}

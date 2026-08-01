import { ArrowLeft, Rocket } from 'lucide-react';
import { TagInput } from '@/components/config/TagInput';
import { ResumeUpload } from '@/components/config/ResumeUpload';
import { Button } from '@/components/ui/Button';
import { WORK_TYPES } from '@/constants';
import { cn } from '@/lib/utils';

const labelCls = 'block text-xs font-medium uppercase tracking-wider text-slate-500';
const hintCls = 'text-xs text-slate-600';

interface ProfileStepProps {
  titles: string[];
  onTitlesChange: (titles: string[]) => void;
  suggestedTitles: string[];
  workType: string;
  onWorkTypeChange: (workType: string) => void;
  locations: string[];
  onLocationsChange: (locations: string[]) => void;
  locationSuggestions: string[];
  onLocationInput: (value: string) => void;
  resumePath: string;
  onResumePathChange: (path: string) => void;
  fileSuggestions: string[];
  onFileInput: (value: string) => void;
  onShowJobs: () => void;
  onSkip: () => void;
  onBack: () => void;
  saving: boolean;
  error?: string | null;
}

/** Step 2: confirm the AI-generated search profile before the first dry run. */
export function ProfileStep({
  titles,
  onTitlesChange,
  suggestedTitles,
  workType,
  onWorkTypeChange,
  locations,
  onLocationsChange,
  locationSuggestions,
  onLocationInput,
  resumePath,
  onResumePathChange,
  fileSuggestions,
  onFileInput,
  onShowJobs,
  onSkip,
  onBack,
  saving,
  error,
}: ProfileStepProps) {
  const remainingSuggestions = suggestedTitles.filter((t) => !titles.includes(t));

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-100"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-semibold text-slate-50">
          Does this look right?
        </h1>
        <p className="text-sm text-slate-400">
          Confirm the roles you&apos;re hunting for — add or remove freely.
        </p>
      </div>

      <div className="space-y-2">
        <label className={labelCls}>Target roles</label>
        <TagInput
          tags={titles}
          onTagsChange={onTitlesChange}
          placeholder="Senior Go Engineer — press Enter to add"
          suggestions={remainingSuggestions}
        />
        <p className={hintCls}>
          Generated from your description — edit anytime.
        </p>
      </div>

      <div className="space-y-2">
        <label className={labelCls}>Work type</label>
        <div className="flex flex-wrap gap-1.5">
          {WORK_TYPES.map((wt) => (
            <button
              key={wt}
              type="button"
              onClick={() => onWorkTypeChange(wt)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs capitalize transition-all',
                workType === wt
                  ? 'bg-neon-cyan/15 text-neon-cyan'
                  : 'bg-ink-800/60 text-slate-400 hover:text-slate-200',
              )}
            >
              {wt}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelCls}>Locations</label>
        <TagInput
          tags={locations}
          onTagsChange={onLocationsChange}
          placeholder="Berlin, Germany — press Enter to add"
          suggestions={locationSuggestions}
          onInputChange={onLocationInput}
        />
        <p className={hintCls}>
          Optional — leave empty to search everywhere. Autocomplete as you
          type.
        </p>
      </div>

      <div className="space-y-2">
        <ResumeUpload
          resumePath={resumePath}
          onResumeChange={onResumePathChange}
          fileSuggestions={fileSuggestions}
          onFileInput={onFileInput}
          analyzing={false}
          analysisMsg={null}
          onAnalyze={() => undefined}
          showAnalyze={false}
        />
        <p className={hintCls}>
          Only needed before auto-apply — you can skip this for now. Details
          found in your resume (name, email, LinkedIn, phone…) are saved to
          your profile automatically.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          size="lg"
          className="flex-1"
          loading={saving}
          onClick={onShowJobs}
          leftIcon={<Rocket className="h-4 w-4" />}
        >
          Show me jobs — safe dry run
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onSkip}
          className="flex-1"
        >
          Skip — go to the dashboard
        </Button>
      </div>

      <p className="text-center font-mono text-[11px] text-slate-500">
        First run is a dry run — nothing is submitted.
      </p>
    </div>
  );
}

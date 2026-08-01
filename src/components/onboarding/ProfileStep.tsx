import { ArrowLeft, Rocket, Sparkles } from 'lucide-react';
import { TagInput } from '@/components/config/TagInput';
import { ResumeUpload } from '@/components/config/ResumeUpload';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { WORK_TYPES } from '@/constants';
import { detectProfession } from '@/lib/profession';
import { cn } from '@/lib/utils';

const labelCls =
  'block text-xs font-medium uppercase tracking-wider text-slate-500';
const hintCls = 'text-xs text-slate-600';
const inputCls =
  'w-full rounded-xl border border-white/5 bg-ink-950/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 transition-colors focus:border-neon-cyan/40 focus:outline-none';

interface ProfileStepProps {
  /** Free-text aspiration that generated the suggestions, if any. */
  intent?: string;
  titles: string[];
  onTitlesChange: (titles: string[]) => void;
  suggestedTitles: string[];
  workType: string;
  onWorkTypeChange: (workType: string) => void;
  locations: string[];
  onLocationsChange: (locations: string[]) => void;
  locationSuggestions: string[];
  onLocationInput: (value: string) => void;
  firstName: string;
  onFirstNameChange: (value: string) => void;
  lastName: string;
  onLastNameChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  applyConsent: boolean;
  onApplyConsentChange: (value: boolean) => void;
  resumePath: string;
  onResumePathChange: (path: string) => void;
  fileSuggestions: string[];
  onFileInput: (value: string) => void;
  analyzing: boolean;
  analysisMsg: string | null;
  onAnalyze: () => void;
  /** Whether AI Assist is on — drives the resume-analysis nudge. */
  aiEnabled: boolean;
  onShowJobs: () => void;
  onSkip: () => void;
  onBack: () => void;
  saving: boolean;
  error?: string | null;
}

/** Step 2: confirm the AI-generated search profile before the first dry run. */
export function ProfileStep({
  intent,
  titles,
  onTitlesChange,
  suggestedTitles,
  workType,
  onWorkTypeChange,
  locations,
  onLocationsChange,
  locationSuggestions,
  onLocationInput,
  firstName,
  onFirstNameChange,
  lastName,
  onLastNameChange,
  email,
  onEmailChange,
  applyConsent,
  onApplyConsentChange,
  resumePath,
  onResumePathChange,
  fileSuggestions,
  onFileInput,
  analyzing,
  analysisMsg,
  onAnalyze,
  aiEnabled,
  onShowJobs,
  onSkip,
  onBack,
  saving,
  error,
}: ProfileStepProps) {
  const remainingSuggestions = suggestedTitles.filter(
    (t) => !titles.includes(t),
  );

  // Profession-aware badge: derive the domain from the intent + suggestions so
  // it works with or without the backend's "profession" field. Unknown → none.
  const profession = detectProfession([intent ?? '', ...suggestedTitles].join(' '));

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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className={labelCls}>First name</span>
          <input
            className={inputCls}
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder="Ada"
          />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>Last name</span>
          <input
            className={inputCls}
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder="Lovelace"
          />
        </label>
      </div>
      <label className="space-y-1">
        <span className={labelCls}>Email</span>
        <input
          type="email"
          className={inputCls}
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="ada@example.com"
        />
      </label>

      <div className="space-y-2">
        <label className={labelCls}>Target roles</label>
        {profession && (
          <Badge className="border-neon-cyan/25 bg-neon-cyan/10 text-neon-cyan">
            <Sparkles className="h-3 w-3" />
            Detected: {profession}
          </Badge>
        )}
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
          Optional — leave empty to search everywhere. Autocomplete as you type.
        </p>
      </div>

      <div className="space-y-2">
        <ResumeUpload
          resumePath={resumePath}
          onResumeChange={onResumePathChange}
          fileSuggestions={fileSuggestions}
          onFileInput={onFileInput}
          analyzing={analyzing}
          analysisMsg={analysisMsg}
          onAnalyze={onAnalyze}
          showAnalyze
        />
        <p className={hintCls}>
          Only needed before auto-apply — you can skip this for now. Details
          found in your resume (name, email, LinkedIn, phone…) are saved to your
          profile automatically.
        </p>
        {resumePath.trim() && !aiEnabled && (
          <p className="text-xs text-neon-amber/90">
            AI Assist is off — resume analysis is basic (validity + contact
            only). Turn it on to get a full career profile, skill extraction,
            and per-job fit scores.
          </p>
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neon-amber/20 bg-neon-amber/5 px-3.5 py-3">
        <input
          type="checkbox"
          checked={applyConsent}
          onChange={(e) => onApplyConsentChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-neon-cyan"
        />
        <span className="text-xs leading-relaxed text-slate-300">
          I consent to Nexus submitting applications on my behalf, within my
          daily and per-run caps, with a pause between each. You&apos;ll confirm
          again right before anything is actually sent.
        </span>
      </label>

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

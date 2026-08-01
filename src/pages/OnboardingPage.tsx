import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Background from '@/components/Background';
import Logo from '@/components/Logo';
import { Card } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/PageLoader';
import { LaunchStep } from '@/components/onboarding/LaunchStep';
import { ProfileStep } from '@/components/onboarding/ProfileStep';
import { StepRail } from '@/components/onboarding/StepRail';
import { WelcomeStep } from '@/components/onboarding/WelcomeStep';
import { useConfig } from '@/hooks/useConfig';
import { useStartRun } from '@/hooks/useStartRun';
import { useUpdateConfig } from '@/hooks/useUpdateConfig';
import { api } from '@/lib/api';
import { emptyProfile, shouldOnboard } from '@/lib/onboarding';
import { contactPatch } from '@/lib/resume-backfill';
import type { NexusConfig } from '@/types';
import type { ResumeContact } from '@/types/resume';

type Step = 'welcome' | 'profile' | 'launch';

const STEP_INDEX: Record<Step, number> = { welcome: 0, profile: 1, launch: 2 };

const LAUNCH_DELAY_MS = 700;

/**
 * The first-run wizard: one aspiration sentence → editable search profile →
 * an automatic safe dry run on the Dashboard.
 */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { data: existing, isLoading } = useConfig();
  const saveConfig = useUpdateConfig();
  const startRun = useStartRun();

  const [step, setStep] = useState<Step>('welcome');
  const [intent, setIntent] = useState('');
  const [suggested, setSuggested] = useState<string[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [workType, setWorkType] = useState('Remote');
  const [locations, setLocations] = useState<string[]>([]);
  const [resumePath, setResumePath] = useState('');
  const [liveTitles, setLiveTitles] = useState<string[]>([]);
  const [aiOff, setAiOff] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [fileSuggestions, setFileSuggestions] = useState<string[]>([]);
  const [resumeContact, setResumeContact] = useState<ResumeContact | null>(
    null,
  );
  const analyzedResumePath = useRef('');
  const locTimer = useRef<ReturnType<typeof setTimeout>>();
  const fileTimer = useRef<ReturnType<typeof setTimeout>>();
  const [error, setError] = useState<string | null>(null);

  // Returning users (already onboarded) should never see the wizard.
  useEffect(() => {
    if (existing && !shouldOnboard(existing)) {
      navigate('/dashboard', { replace: true });
    }
  }, [existing, navigate]);

  const years = existing?.yearsOfExperience;

  // Live suggestions while typing: real AI when enabled, a heuristic
  // fallback (with an honest hint) otherwise. Only while on the welcome step.
  useEffect(() => {
    if (step !== 'welcome') return;
    const text = intent.trim();
    if (!text) {
      setLiveTitles([]);
      setAiOff(false);
      return;
    }
    const id = window.setTimeout(async () => {
      try {
        const res = await api.suggestJobTitles(text, years);
        setLiveTitles(res.titles);
        setAiOff(false);
      } catch {
        setLiveTitles([]);
        setAiOff(true);
      }
    }, 350);
    return () => window.clearTimeout(id);
  }, [intent, years, step]);

  // Debounced geo autocomplete for the Locations field.
  const handleLocationInput = useCallback((value: string) => {
    if (locTimer.current) clearTimeout(locTimer.current);
    if (value.length < 2) {
      setLocationSuggestions([]);
      return;
    }
    locTimer.current = setTimeout(async () => {
      try {
        const results = await api.geoSearch(value);
        setLocationSuggestions(results.map((r) => r.label));
      } catch {
        setLocationSuggestions([]);
      }
    }, 300);
  }, []);

  // Debounced filesystem autocomplete for the resume path field.
  const handleFileInput = useCallback((value: string) => {
    if (fileTimer.current) clearTimeout(fileTimer.current);
    if (value.length < 2) {
      setFileSuggestions([]);
      return;
    }
    fileTimer.current = setTimeout(async () => {
      try {
        setFileSuggestions(await api.getFSAutocomplete(value));
      } catch {
        setFileSuggestions([]);
      }
    }, 300);
  }, []);

  // Clear pending suggestion timers on unmount.
  useEffect(() => {
    return () => {
      if (locTimer.current) clearTimeout(locTimer.current);
      if (fileTimer.current) clearTimeout(fileTimer.current);
    };
  }, []);

  // Analyze an uploaded/typed resume once and remember the parsed contact so
  // the saved profile gets backfilled (name, email, phone, LinkedIn, years…).
  useEffect(() => {
    const path = resumePath.trim();
    if (!path || path === analyzedResumePath.current) return;
    analyzedResumePath.current = path;
    api
      .reanalyzeResume(path)
      .then((r) => {
        if (r.valid) setResumeContact(r.contact ?? null);
      })
      .catch(() => undefined);
  }, [resumePath]);

  if (isLoading) return <PageLoader label="Loading your profile" />;

  const base: NexusConfig = existing ?? emptyProfile();
  const saving = saveConfig.isPending || startRun.isPending;

  function mergedConfig(): NexusConfig {
    const backfill = contactPatch(base, resumeContact);
    return {
      ...base,
      firstName: backfill.firstName ?? base.firstName,
      lastName: backfill.lastName ?? base.lastName,
      email: backfill.email ?? base.email,
      phone: backfill.phone ?? base.phone,
      linkedinId: backfill.linkedinId ?? base.linkedinId,
      yearsOfExperience: backfill.yearsOfExperience ?? base.yearsOfExperience,
      skills: backfill.skills ?? base.skills,
      targetJobTitles: titles.join(', '),
      jobIntent: intent.trim(),
      workType,
      targetLocations: locations.join(', '),
      resumePath: resumePath.trim(),
    };
  }

  async function handleGenerate() {
    const text = intent.trim();
    if (!text) return;
    setError(null);
    // Live chips usually already arrived; if the user clicked before the
    // debounce fired, fetch suggestions directly (AI or heuristic fallback).
    if (liveTitles.length > 0) {
      setSuggested(liveTitles);
      setTitles(liveTitles);
      setStep('profile');
      return;
    }
    try {
      const res = await api.suggestJobTitles(text, years);
      setSuggested(res.titles);
      setTitles(res.titles);
    } catch {
      // AI title service unreachable — don't fabricate titles. The user can
      // add roles manually in the next step or explore with defaults.
      setSuggested([]);
      setTitles([]);
      setError(
        'Could not load AI title suggestions. Add target roles manually below, or skip to the dashboard.',
      );
    }
    setStep('profile');
  }

  function handleExplore() {
    setIntent((prev) => prev.trim() || 'exploring');
    setSuggested([]);
    setStep('profile');
  }

  // Pick the best installed local model so one click actually turns AI on.
  async function defaultLocalModel(): Promise<string> {
    try {
      const status = await api.getLLMStatus();
      const best = status.models.find((m) => m.installed && m.best)?.name;
      return best || status.installed[0] || 'llama3.2:latest';
    } catch {
      return 'llama3.2:latest';
    }
  }

  // One-click AI onboarding: turn on local AI with the installed model.
  async function handleEnableAI() {
    setError(null);
    try {
      const model = await defaultLocalModel();
      await saveConfig.mutateAsync({
        ...base,
        aiAssist: true,
        aiProvider: 'local',
        localLLMURL: base.localLLMURL || 'http://localhost:11434',
        localLLMModel: base.localLLMModel || model,
      });
      const text = intent.trim();
      if (text) {
        try {
          const res = await api.suggestJobTitles(text, years);
          setLiveTitles(res.titles);
          setAiOff(false);
        } catch {
          setLiveTitles([]);
          setAiOff(true);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to enable AI Assist.');
    }
  }

  async function handleShowJobs() {
    setError(null);
    try {
      await saveConfig.mutateAsync(mergedConfig());
      await startRun.mutateAsync({ dryRun: true, autoApply: false });
      setStep('launch');
      // Let the launch moment breathe, then land on the streaming dashboard.
      window.setTimeout(
        () => navigate('/dashboard', { replace: true }),
        LAUNCH_DELAY_MS,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start your search.');
    }
  }

  async function handleSkip() {
    setError(null);
    try {
      await saveConfig.mutateAsync(mergedConfig());
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save your profile.');
    }
  }

  return (
    <div className="relative min-h-screen">
      <Background />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-12">
        <Logo className="mb-8" />
        <StepRail active={STEP_INDEX[step]} />
        <Card className="mt-6 w-full p-6 sm:p-8">
          {step === 'welcome' && (
            <WelcomeStep
              intent={intent}
              onIntentChange={setIntent}
              onGenerate={handleGenerate}
              onExplore={handleExplore}
              liveTitles={liveTitles}
              aiEnabled={base.aiAssist}
              aiOff={aiOff}
              onEnableAI={handleEnableAI}
              enablingAI={saving}
              error={error}
            />
          )}
          {step === 'profile' && (
            <ProfileStep
              titles={titles}
              onTitlesChange={setTitles}
              suggestedTitles={suggested}
              workType={workType}
              onWorkTypeChange={setWorkType}
              locations={locations}
              onLocationsChange={setLocations}
              locationSuggestions={locationSuggestions}
              onLocationInput={handleLocationInput}
              resumePath={resumePath}
              onResumePathChange={setResumePath}
              fileSuggestions={fileSuggestions}
              onFileInput={handleFileInput}
              onShowJobs={handleShowJobs}
              onSkip={handleSkip}
              onBack={() => {
                setError(null);
                setStep('welcome');
              }}
              saving={saving}
              error={error}
            />
          )}
          {step === 'launch' && <LaunchStep />}
        </Card>
        <p className="mt-6 max-w-md text-center font-mono text-[11px] text-slate-500">
          Everything stays on this machine. Nothing is submitted without your
          OK.
        </p>
      </div>
    </div>
  );
}

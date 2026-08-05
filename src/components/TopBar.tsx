import { useMission } from '@/hooks/useMission';
import { EngineStatusDot } from '@/components/dashboard/EngineStatusDot';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { supabaseEnabled } from '@/lib/supabase';

export default function TopBar() {
  const { data } = useMission();
  const status = data?.engineStatus ?? 'idle';
  const checks = data?.checks ?? [];
  const done = checks.filter((c) => c.ok).length;
  const pct = checks.length ? Math.round((done / checks.length) * 100) : 0;
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-white/5 bg-ink-950/60 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        <EngineStatusDot status={status} />
        <span className="hidden text-slate-600 sm:inline">·</span>
        <span className="hidden font-mono text-xs text-slate-400 sm:inline">
          {status === 'running' ? 'engine live' : 'engine idle'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="font-mono text-xs text-slate-500">onboarding</span>
          <span
            className={cn(
              'font-mono text-xs font-semibold',
              pct === 100 ? 'text-emerald-400' : 'text-neon-amber',
            )}
          >
            {pct}%
          </span>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-neon-cyan transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {supabaseEnabled && user && (
          <div className="flex items-center gap-2 border-l border-white/5 pl-3">
            <span className="hidden max-w-40 truncate font-mono text-xs text-slate-400 md:inline">
              {user.email}
            </span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-md border border-white/10 px-2 py-1 font-mono text-xs text-slate-400 transition-colors hover:border-neon-cyan/40 hover:text-neon-cyan"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

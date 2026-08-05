import { useState, type FormEvent } from 'react';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

/**
 * LoginPage is the ready-made auth wall shown by AuthGate when Supabase auth
 * is enabled and there is no session. New users can register (email +
 * password, with the provider's email confirmation when enabled), existing
 * users can sign in, and everyone can use a magic link (which auto-registers
 * on first use). All real session work happens in supabase-js — the page only
 * surfaces provider errors.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magic, setMagic] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!supabase) return null; // only ever rendered when auth is enabled
  const sb = supabase;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter your email');
      return;
    }
    if (!magic && !password) {
      setError(mode === 'signup' ? 'Choose a password' : 'Enter your password');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      if (magic) {
        const { error: signErr } = await sb.auth.signInWithOtp({ email: trimmed });
        if (signErr) throw signErr;
        setNotice('Check your inbox for a magic link, then come back here.');
        return;
      }
      if (mode === 'signup') {
        const { data, error: signErr } = await sb.auth.signUp({
          email: trimmed,
          password,
        });
        if (signErr) throw signErr;
        if (!data.session) {
          // Email confirmation is enabled: the new user must click the link.
          setNotice('Account created — check your email to confirm, then sign in.');
          return;
        }
        // Signed in immediately (confirmations off): AuthGate flips by itself.
        return;
      }
      const { error: signErr } = await sb.auth.signInWithPassword({
        email: trimmed,
        password,
      });
      if (signErr) throw signErr;
      // AuthGate flips to the dashboard on the session event.
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : mode === 'signup'
            ? 'Sign up failed'
            : 'Sign in failed',
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-white/10 bg-ink-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-neon-cyan focus:outline-none';

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-neon-cyan/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-neon-amber/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-ink-950/80 p-8 shadow-glow-soft backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo className="h-10 w-10" />
          <h1 className="font-display text-xl font-semibold text-slate-50">
            {mode === 'signup' ? 'Create your Nexus account' : 'Sign in to Nexus'}
          </h1>
          <p className="text-sm text-slate-400">
            {mode === 'signup'
              ? 'Register in seconds — resumes, applications, and outreach, locked to your account.'
              : 'Your job-hunt command center — resumes, applications, and outreach, locked to your account.'}
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-xs font-medium text-slate-400">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          {!magic && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="password"
                className="text-xs font-medium text-slate-400"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          )}

          {notice && (
            <p role="status" className="text-xs text-emerald-400">
              {notice}
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" size="md" disabled={loading}>
            {loading
              ? mode === 'signup'
                ? 'Creating account…'
                : 'Signing in…'
              : magic
                ? 'Send magic link'
                : mode === 'signup'
                  ? 'Sign up'
                  : 'Sign in'}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
            setMagic(false);
            setError(null);
            setNotice(null);
          }}
          className="mt-4 w-full text-center text-xs text-slate-500 hover:text-neon-cyan"
        >
          {mode === 'signin'
            ? 'New to Nexus? Create an account'
            : 'Have an account? Sign in'}
        </button>
        <button
          type="button"
          onClick={() => setMagic((m) => !m)}
          className="mt-1 w-full text-center text-xs text-slate-600 hover:text-neon-cyan"
        >
          {magic ? 'Use email + password instead' : 'Prefer a magic link?'}
        </button>
      </div>
    </div>
  );
}

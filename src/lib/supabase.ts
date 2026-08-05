import { createClient, type Session } from '@supabase/supabase-js';

// Supabase Auth is the identity provider for the hosted web dashboard. When
// VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are unset (local TUI-driven dev,
// docker-compose, or the backend running without auth), the client is null and
// the UI runs without a login wall exactly as before.
const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabaseEnabled = url !== '' && anonKey !== '';

export const supabase = supabaseEnabled ? createClient(url, anonKey) : null;

/** The authenticated user as the API expects it (JWT `sub` is the user id). */
export interface SessionUser {
  id: string;
  email?: string;
  name?: string;
}

/** Maps a Supabase session (claims) onto the Nexus SessionUser shape. */
export function sessionUser(session: Session): SessionUser {
  const meta = session.user.user_metadata as Record<string, unknown> | undefined;
  const name =
    typeof meta?.full_name === 'string'
      ? meta.full_name
      : typeof meta?.name === 'string'
        ? meta.name
        : session.user.email ?? '';
  return { id: session.user.id, email: session.user.email ?? undefined, name };
}
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthGate, AuthProvider } from './auth-context';

const mocks = vi.hoisted(() => ({
  enabled: true,
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('./supabase', () => ({
  get supabaseEnabled() {
    return mocks.enabled;
  },
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signOut: mocks.signOut,
    },
  },
  sessionUser: (s: { user: { id: string; email?: string } }) => ({
    id: s.user.id,
    email: s.user.email,
  }),
}));

// capture the onAuthStateChange listener so tests can fire SIGNED_IN/OUT.
function captureListener() {
  let listener: ((event: string, session: unknown) => void) | undefined;
  mocks.getSession.mockResolvedValue({ data: { session: null } });
  mocks.onAuthStateChange.mockImplementation((cb: (e: string, s: unknown) => void) => {
    listener = cb;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
  return (event: string, session: unknown) => {
    if (listener) listener(event, session);
  };
}

afterEach(() => {
  vi.clearAllMocks();
  mocks.enabled = true;
});

describe('AuthGate', () => {
  it('shows the login wall when there is no session', async () => {
    captureListener();
    render(
      <AuthProvider>
        <AuthGate>
          <div>dashboard-content</div>
        </AuthGate>
      </AuthProvider>,
    );
    expect(
      await screen.findByRole('heading', { name: /sign in to nexus/i }),
    ).toBeVisible();
    expect(screen.queryByText('dashboard-content')).not.toBeInTheDocument();
  });

  it('renders the app once a session is established', async () => {
    const fire = captureListener();
    render(
      <AuthProvider>
        <AuthGate>
          <div>dashboard-content</div>
        </AuthGate>
      </AuthProvider>,
    );
    await screen.findByRole('heading', { name: /sign in to nexus/i });

    act(() => {
      fire?.('SIGNED_IN', { user: { id: 'u1', email: 'ada@example.com' } });
    });

    expect(await screen.findByText('dashboard-content')).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: /sign in to nexus/i }),
    ).not.toBeInTheDocument();
  });

  it('disables the wall when auth is not configured', async () => {
    mocks.enabled = false;
    captureListener();
    render(
      <AuthProvider>
        <AuthGate>
          <div>dashboard-content</div>
        </AuthGate>
      </AuthProvider>,
    );
    expect(screen.getByText('dashboard-content')).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: /sign in to nexus/i }),
    ).not.toBeInTheDocument();
  });
});

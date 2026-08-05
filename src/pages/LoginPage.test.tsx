import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signInWithOtp: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseEnabled: true,
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: mocks.signInWithPassword,
      signInWithOtp: mocks.signInWithOtp,
    },
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('LoginPage', () => {
  it('renders the sign-in form', () => {
    render(<LoginPage />);
    expect(
      screen.getByRole('heading', { name: /sign in to nexus/i }),
    ).toBeVisible();
  });

  it('requires an email and password', async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Enter your email')).toBeVisible();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Enter your password')).toBeVisible();
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it('surfaces provider errors', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      error: new Error('Invalid login credentials'),
    });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'hunter2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid login credentials')).toBeVisible();
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'hunter2',
    });
  });

  it('sends a magic link when the magic option is toggled', async () => {
    mocks.signInWithOtp.mockResolvedValue({ error: null });
    render(<LoginPage />);
    fireEvent.click(screen.getByText(/prefer a magic link/i));

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    expect(
      await screen.findByText(/check your inbox for a magic link/i),
    ).toBeVisible();
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: 'ada@example.com',
    });
  });
});

import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import type { FullConfig } from '@playwright/test';

/**
 * Global E2E setup:
 *  1. builds the Nexus Go backend + cmd/e2e-seed (../terminal-job),
 *  2. seeds deterministic fixture applications into an isolated $HOME,
 *  3. starts `nexus --api` on :18080 against that HOME.
 * Returns a teardown that kills the backend after the run.
 */
// Playwright runs with cwd = the directory containing playwright.config.ts.
const repoRoot = process.cwd();
const backendRoot = path.resolve(repoRoot, '../terminal-job');

const PORT = 18080;
const BIN_DIR = '/tmp/nexus-e2e-bin';
const HOME_DIR = '/tmp/nexus-e2e-home';
const HEALTH_URL = `http://localhost:${PORT}/health`;

let child: ChildProcess | undefined;

async function waitForHealth(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // backend not up yet
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Nexus backend did not become healthy at ${url}`);
}

export default async function globalSetup(
  _config: FullConfig,
): Promise<() => void> {
  // Clear any leftover test backend on our port.
  try {
    execFileSync('pkill', ['-f', `nexus --api --api-port ${PORT}`], {
      stdio: 'ignore',
    });
  } catch {
    // nothing to kill
  }

  rmSync(HOME_DIR, { recursive: true, force: true });
  mkdirSync(BIN_DIR, { recursive: true });
  mkdirSync(HOME_DIR, { recursive: true });

  execFileSync('go', ['build', '-o', path.join(BIN_DIR, 'nexus'), '.'], {
    cwd: backendRoot,
    stdio: 'pipe',
  });
  execFileSync(
    'go',
    ['build', '-o', path.join(BIN_DIR, 'e2e-seed'), './cmd/e2e-seed'],
    { cwd: backendRoot, stdio: 'pipe' },
  );

  execFileSync(
    path.join(BIN_DIR, 'e2e-seed'),
    ['-db', path.join(HOME_DIR, '.nexus', 'applications.db')],
    {
      env: { ...process.env, HOME: HOME_DIR },
    },
  );

  child = spawn(
    path.join(BIN_DIR, 'nexus'),
    ['--api', '--api-port', String(PORT)],
    {
      cwd: backendRoot,
      env: { ...process.env, HOME: HOME_DIR },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  child.stdout?.on('data', (d) => process.stdout.write(`[nexus] ${d}`));
  child.stderr?.on('data', (d) => process.stdout.write(`[nexus] ${d}`));

  await waitForHealth(HEALTH_URL);

  return async () => {
    if (child && !child.killed) child.kill('SIGTERM');
  };
}

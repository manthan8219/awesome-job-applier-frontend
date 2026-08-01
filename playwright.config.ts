import { defineConfig } from '@playwright/test';

/**
 * End-to-end tests: the real React app (Vite dev server) talking to the real
 * Nexus Go backend (built + seeded + started by e2e/global-setup.ts on a
 * dedicated port, in an isolated $HOME).
 *
 * Run: npm run test:e2e   (requires `go` and the ../terminal-job repo)
 */
const API_PORT = 18080;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      VITE_API_BASE_URL: `http://localhost:${API_PORT}/api`,
    },
  },
});

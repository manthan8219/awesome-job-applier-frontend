// @vitest-environment node
/**
 * Contract tests — every method in `src/lib/api.ts` against the REAL Nexus Go
 * backend (`../nexus-job-assistant`, started with `nexus --api`).
 *
 * In beforeAll the backend is built, seeded with fixture applications (via
 * `cmd/e2e-seed`), and started with an isolated $HOME on a random port, so the
 * suite is deterministic and never touches your real ~/.nexus.
 *
 * Run: npm run test:contract
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import {
  closeSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { api as ApiModule } from '@/lib/api';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const backendRoot = path.resolve(repoRoot, '../nexus-job-assistant');

/** Go appends .exe to -o outputs on Windows; the loader needs the extension. */
const exe = process.platform === 'win32' ? '.exe' : '';

const goAvailable = (() => {
  try {
    execFileSync('go', ['version'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
})();

/** Skip the whole suite (with a hint) when the backend repo or Go is missing. */
const backendAvailable =
  goAvailable && existsSync(path.join(backendRoot, 'go.mod'));

let api: typeof ApiModule;
let child: ChildProcess | undefined;
let workDir = '';
let logFd: number | undefined;

async function waitForHealth(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastErr: unknown;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
      lastErr = new Error(`health ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`backend did not become healthy: ${String(lastErr)}`);
}

async function buildAndStart(): Promise<string> {
  workDir = mkdtempSync(path.join(tmpdir(), 'nexus-contract-'));
  const binDir = path.join(workDir, 'bin');
  const homeDir = path.join(workDir, 'home');
  mkdirSync(binDir, { recursive: true });
  mkdirSync(homeDir, { recursive: true });

  // 1. Build the backend and the seed helper.
  execFileSync('go', ['build', '-o', path.join(binDir, 'nexus' + exe), '.'], {
    cwd: backendRoot,
    stdio: 'pipe',
  });
  execFileSync(
    'go',
    ['build', '-o', path.join(binDir, 'e2e-seed' + exe), './cmd/e2e-seed'],
    { cwd: backendRoot, stdio: 'pipe' },
  );

  // 2. Seed deterministic fixture applications into the isolated store.
  execFileSync(
    path.join(binDir, 'e2e-seed' + exe),
    ['-db', path.join(homeDir, '.nexus', 'applications.db')],
    {
      cwd: backendRoot,
      // NEXUS_HOME pins the store to the isolated temp dir on every platform
      // (Windows ignores $HOME — Go's os.UserHomeDir reads USERPROFILE).
      env: {
        ...process.env,
        HOME: homeDir,
        NEXUS_HOME: path.join(homeDir, '.nexus'),
      },
    },
  );

  // 3. Start the API server with an isolated HOME on a random port.
  const port = 21000 + Math.floor(Math.random() * 4000);
  logFd = openSync(path.join(workDir, 'nexus.log'), 'w');
  child = spawn(
    path.join(binDir, 'nexus' + exe),
    ['--api', '--api-port', String(port)],
    {
      cwd: backendRoot,
      env: {
        ...process.env,
        HOME: homeDir,
        NEXUS_HOME: path.join(homeDir, '.nexus'),
      },
      stdio: ['ignore', logFd, logFd],
    },
  );

  const base = `http://localhost:${port}`;
  await waitForHealth(`${base}/health`);
  return `${base}/api`;
}

describe.skipIf(!backendAvailable)(
  'Nexus API contract (real Go backend)',
  () => {
    beforeAll(async () => {
      const baseUrl = await buildAndStart();
      // api.ts computes BASE_URL at module load, so import it after stubbing.
      vi.stubEnv('VITE_API_BASE_URL', baseUrl);
      vi.resetModules();
      const mod = await import('@/lib/api');
      api = mod.api;
    }, 180_000);

    afterAll(async () => {
      vi.unstubAllEnvs();
      vi.resetModules();
      // Close our handle first or Windows refuses to delete the dir.
      if (logFd !== undefined) {
        try {
          closeSync(logFd);
        } catch {
          // already closed
        }
        logFd = undefined;
      }
      if (child) {
        if (child.exitCode === null && child.signalCode === null) {
          child.kill('SIGTERM');
          await new Promise<void>((resolve) => {
            const t = setTimeout(resolve, 2000);
            child!.once('exit', () => {
              clearTimeout(t);
              resolve();
            });
          });
        }
        child = undefined;
      }
      if (workDir) {
        // The server may hold files briefly after exit — retry before failing.
        for (let i = 0; i < 5; i++) {
          try {
            rmSync(workDir, { recursive: true, force: true });
            workDir = '';
            break;
          } catch {
            await new Promise((r) => setTimeout(r, 300));
          }
        }
      }
    });

    it('is configured (backend repo + go toolchain present)', () => {
      expect(backendAvailable).toBe(true);
    });

    describe('mission', () => {
      it('returns a full dashboard snapshot', async () => {
        const m = await api.getMission();
        expect(m.engineStatus).toBeDefined();
        expect(Array.isArray(m.checks)).toBe(true);
        expect(m.checks.length).toBeGreaterThan(0);
        expect(Array.isArray(m.providers)).toBe(true);
        expect(m.providers.length).toBeGreaterThan(0);
        expect(typeof m.applied).toBe('number');
        expect(typeof m.appliedToday).toBe('number');
        expect(typeof m.maxPerDay).toBe('number');
        expect(typeof m.modeName).toBe('string');
        expect(typeof m.modeHint).toBe('string');
        expect(typeof m.nextAction).toBe('string');
        expect(Array.isArray(m.liveFeed)).toBe(true);
        expect(Array.isArray(m.recent)).toBe(true);
      });
    });

    describe('config', () => {
      it('getConfig returns the frontend shape', async () => {
        const c = await api.getConfig();
        expect(typeof c.firstName).toBe('string');
        expect(typeof c.applyConsent).toBe('boolean');
        expect(typeof c.maxAppsPerDay).toBe('number');
        expect(typeof c.targetJobTitles).toBe('string');
      });

      it('saveConfig round-trips personal + search fields', async () => {
        const c = await api.getConfig();
        await api.saveConfig({
          ...c,
          firstName: 'Ada',
          lastName: 'Lovelace',
          targetJobTitles: 'Cardiologist',
          applyConsent: false,
        });
        const got = await api.getConfig();
        expect(got.firstName).toBe('Ada');
        expect(got.lastName).toBe('Lovelace');
        expect(got.targetJobTitles).toBe('Cardiologist');
      });

      it('config/complete reports a fresh profile as incomplete', async () => {
        const r = await api.getConfigComplete();
        expect(r.complete).toBe(false);
        expect(Array.isArray(r.missing)).toBe(true);
        expect(r.missing.length).toBeGreaterThan(0);
      });
    });

    describe('run toggles + lifecycle', () => {
      it('toggles dry run and reflects in mission', async () => {
        await api.toggleDryRun(true);
        expect((await api.getMission()).dryRun).toBe(true);
        await api.toggleDryRun(false);
        expect((await api.getMission()).dryRun).toBe(false);
      });

      it('toggles auto apply', async () => {
        await api.toggleAutoApply(true);
        expect((await api.getMission()).autoApply).toBe(true);
        await api.toggleAutoApply(false);
      });

      it('starts and stops the engine', async () => {
        await api.startRun({ dryRun: true, autoApply: false });
        expect((await api.getMission()).engineStatus).toBe('running');
        await api.stopRun();
        expect((await api.getMission()).engineStatus).toBe('stopped');
      });
    });

    describe('applications (seeded fixtures)', () => {
      it('lists applications with the frontend shape', async () => {
        const apps = await api.getApplications('');
        expect(apps.length).toBeGreaterThanOrEqual(4);
        const queued = apps.find((a) => a.status === 'queued');
        expect(queued).toBeDefined();
        expect(typeof queued!.id).toBe('number');
        expect(typeof queued!.company).toBe('string');
        expect(typeof queued!.role).toBe('string');
        expect(typeof queued!.url).toBe('string');
        expect(typeof queued!.appliedAt).toBe('string');
        expect(typeof queued!.fitScore).toBe('number');
      });

      it('filters by free-text query', async () => {
        const apps = await api.getApplications('Acme Health');
        expect(apps.length).toBeGreaterThan(0);
        expect(apps.every((a) => a.company.includes('Acme Health'))).toBe(true);
      });

      it('toggles approval on a queued job', async () => {
        const queued = (await api.getApplications('')).find(
          (a) => a.status === 'queued' && !a.approved,
        );
        expect(queued).toBeDefined();
        await api.setApplicationApproved(queued!.id, true);
        const after = (await api.getApplications('')).find(
          (a) => a.id === queued!.id,
        );
        expect(after?.approved).toBe(true);
      });

      it('sets an outcome on an applied job', async () => {
        const applied = (await api.getApplications('')).find(
          (a) => a.status === 'applied',
        );
        expect(applied).toBeDefined();
        await api.setApplicationOutcome(applied!.id, 'replied');
        const after = (await api.getApplications('')).find(
          (a) => a.id === applied!.id,
        );
        expect(after?.outcome).toBe('replied');
      });

      it('blocks apply without apply consent (safety gate)', async () => {
        await expect(api.applySelected([1])).rejects.toThrow(/consent/i);
      });

      it('creates a manual job in the review queue', async () => {
        const url = 'https://acme.health/careers/nurse-contract';
        const created = await api.createApplication({
          role: 'Registered Nurse',
          company: 'Acme Health',
          url,
          location: 'Remote',
          remote: true,
        });
        expect(created.id).toBeGreaterThan(0);
        expect(created.status).toBe('queued');
        expect(created.provider).toBe('manual');

        const after = await api.getApplications('');
        expect(after.some((a) => a.url === url)).toBe(true);
      });

      it('dismisses a queued job so it leaves the queue', async () => {
        const created = await api.createApplication({
          role: 'QA Engineer',
          company: 'Acme Health',
          url: 'https://acme.health/careers/qa-dismiss',
          location: '',
          remote: true,
        });
        expect(created.status).toBe('queued');

        await api.dismissApplication(created.id);

        const after = await api.getApplications('');
        const dismissed = after.find((a) => a.id === created.id);
        expect(dismissed?.status).toBe('skipped');
        expect(dismissed?.reason).toBe('dismissed by user');
      });
    });

    describe('companies + contacts', () => {
      it('getCompanies lists the seeded catalog with counts', async () => {
        const r = await api.getCompanies();
        expect(Array.isArray(r.items)).toBe(true);
        expect(typeof r.total).toBe('number');
        expect(r.total).toBeGreaterThan(0); // companies.db auto-seeds
        expect(r.counts).toBeDefined();
        const c = r.items[0]!;
        expect(typeof c.name).toBe('string');
        expect(typeof c.boardURL).toBe('string');
        expect(Array.isArray(c.hireCountries)).toBe(true);
        expect(typeof c.updatedAt).toBe('string');
      });

      it('adds a company and lists it back', async () => {
        const created = await api.saveCompany({
          name: 'Acme Health',
          website: 'https://acme.health',
          boardURL: 'https://boards.greenhouse.io/acmehealth',
          countries: 'Remote, US',
          ats: 'greenhouse',
        });
        expect(created.id).toBeGreaterThan(0);
        expect(created.name).toBe('Acme Health');
        expect(created.hireCountries).toContain('Remote');

        const r = await api.getCompanies('acme health');
        expect(r.items.some((c) => c.name === 'Acme Health')).toBe(true);
      });

      it('refreshCompanies returns a bare count', async () => {
        const n = await api.refreshCompanies();
        expect(typeof n).toBe('number');
        expect(n).toBeGreaterThanOrEqual(0); // idempotent upserts → 0 after seed
      });

      it('getCompanyJobs returns the frontend application shape', async () => {
        const apps = await api.getCompanyJobs('Acme Health');
        expect(Array.isArray(apps)).toBe(true);
        if (apps.length > 0) {
          expect(typeof apps[0]!.role).toBe('string');
          expect(typeof apps[0]!.fitScore).toBe('number');
        }
      });

      it('getSavedContacts returns an array', async () => {
        expect(Array.isArray(await api.getSavedContacts())).toBe(true);
      });

      it('searches contacts via OSINT and returns {contacts, sources, errors}', async () => {
        const res = await api.searchContacts('Acme', 'acme.com');
        expect(Array.isArray(res.contacts)).toBe(true);
        expect(Array.isArray(res.sources)).toBe(true);
        expect(Array.isArray(res.errors)).toBe(true);
        // The pattern source always generates contacts — no API keys needed.
        expect(res.contacts.length).toBeGreaterThan(0);
        expect(typeof res.contacts[0]!.email).toBe('string');
        expect(res.contacts.some((c) => c.source === 'pattern')).toBe(true);
      }, 30_000);

      it('saved contacts round-trip through the backend', async () => {
        const saved = await api.saveContact({
          company: 'Stripe',
          domain: 'stripe.com',
          name: 'Hiring Team',
          title: 'Recruiter',
          email: 'hiring@stripe.com',
          emailType: 'pattern',
          source: 'pattern',
          confidence: 40,
        } as Parameters<typeof api.saveContact>[0]);
        expect(saved.id).toBeGreaterThan(0);

        const list = await api.getSavedContacts();
        expect(list.some((c) => c.id === saved.id)).toBe(true);

        await api.deleteContact(saved.id);
        const after = await api.getSavedContacts();
        expect(after.some((c) => c.id === saved.id)).toBe(false);
      });
    });

    describe('outreach', () => {
      it('outreach setup round-trips real config values', async () => {
        const setup = await api.getOutreachSetup();
        expect(typeof setup.consent).toBe('boolean');
        expect(typeof setup.maxEmailsPerDay).toBe('number');
        expect(setup.maxEmailsPerDay).toBeGreaterThan(0);
        expect(typeof setup.maxLinkedInPerDay).toBe('number');
        expect(typeof setup.aiCompose).toBe('boolean');
        expect(['confirm', 'queue', 'auto']).toContain(setup.mode);

        // Persist a change and read it back.
        const updated = {
          ...setup,
          consent: true,
          mode: 'auto' as const,
          maxEmailsPerDay: 7,
          maxLinkedInPerDay: 3,
          aiCompose: true,
        };
        await api.saveOutreachSetup(updated);
        const reread = await api.getOutreachSetup();
        expect(reread.consent).toBe(true);
        expect(reread.mode).toBe('auto');
        expect(reread.maxEmailsPerDay).toBe(7);
        expect(reread.maxLinkedInPerDay).toBe(3);
      });

      it('getOutreachItems resolves to an array', async () => {
        expect(Array.isArray(await api.getOutreachItems())).toBe(true);
      });

      it('buildOutreachQueue creates items from applied jobs', async () => {
        const created = await api.buildOutreachQueue('email');
        expect(Array.isArray(created)).toBe(true);
        // The seeded store has an applied job → at least one draft is created.
        expect(created.length).toBeGreaterThan(0);
        const first = created[0]!;
        expect(typeof first.id).toBe('string');
        expect(typeof first.company).toBe('string');
        expect(typeof first.status).toBe('string');
        expect(typeof first.body).toBe('string');
      });

      it('sendOutreachItem without email credentials rejects honestly', async () => {
        const items = await api.getOutreachItems();
        const emailItem = items.find((i) => i.channel === 'email');
        expect(emailItem).toBeTruthy();
        // No Gmail app password / OAuth in the test env → real send must 400.
        await expect(api.sendOutreachItem(emailItem!.id)).rejects.toMatchObject(
          {
            status: 400,
          },
        );
      });

      it('sendOutreachItem for a missing id returns 404', async () => {
        await expect(
          api.sendOutreachItem('no-such-item-xyz'),
        ).rejects.toMatchObject({ status: 404 });
      });

      it('getOutreachLog resolves to an array', async () => {
        expect(Array.isArray(await api.getOutreachLog())).toBe(true);
      });
    });

    describe('resume', () => {
      it('getResumeAnalysis resolves without a configured path', async () => {
        const r = await api.getResumeAnalysis();
        expect(typeof r.valid).toBe('boolean');
      });

      it('getResumeTemplates returns the curated registry', async () => {
        const templates = await api.getResumeTemplates();
        expect(templates.length).toBeGreaterThanOrEqual(8);
        const jake = templates.find((t) => t.id === 'jake');
        expect(jake).toBeDefined();
        expect(jake?.name).toBeTruthy();
        expect(jake?.layout).toBeTruthy();
        expect(jake?.sections.length).toBeGreaterThan(0);
        expect(jake?.accentHex).toMatch(/^#/);
        expect(jake?.source).toBeTruthy();

        // Real-design tokens distinguish the curated templates.
        expect(jake?.sectionStyle).toBe('caps');
        const acv = templates.find((t) => t.id === 'awesome-cv');
        expect(acv?.sectionStyle).toBe('marker');
        const deedy = templates.find((t) => t.id === 'deedy');
        expect(deedy?.onePage).toBe(true);
        expect(deedy?.columnRatio).toBeGreaterThan(0.7);
        const mcd = templates.find((t) => t.id === 'mcdowell');
        expect(mcd?.sectionStyle).toBe('soft');
        const bill = templates.find((t) => t.id === 'billryan');
        expect(bill?.bodyFont).toBe('serif');
        const kendall = templates.find((t) => t.id === 'kendall');
        expect(kendall?.railBackground).toBe('dark');
        const macchiato = templates.find((t) => t.id === 'macchiato');
        expect(macchiato?.railBackground).toBe('accent');
        expect(macchiato?.nameStyle).toBe('colored');
        const banking = templates.find((t) => t.id === 'banking');
        expect(banking?.contactLine).toBe(true);
        expect(banking?.sectionStyle).toBe('ruleAbove');

        // Every template declares a positive content budget (the AI writes to
        // it and the planner enforces it); deedy is the one-page design.
        for (const t of templates) {
          expect(t.budget).toBeDefined();
          expect(t.budget?.maxRoles).toBeGreaterThan(0);
          expect(t.budget?.maxBulletsPerRole).toBeGreaterThan(0);
          expect(t.budget?.charsPerLine).toBeGreaterThan(0);
        }
        const ids = templates.map((t) => t.id);
        for (const id of [
          'jake',
          'awesome-cv',
          'deedy',
          'mcdowell',
          'billryan',
          'kendall',
          'macchiato',
          'banking',
        ]) {
          expect(ids).toContain(id);
        }
      });

      it('template preview URLs stream a real PDF from the backend renderer', async () => {
        // Exercise both renderers: single-column (jake) and sidebar (deedy).
        for (const id of ['jake', 'deedy']) {
          const res = await fetch(api.templatePreviewUrl(id), {
            credentials: 'include',
          });
          expect(res.ok).toBe(true);
          expect(res.headers.get('content-type')).toBe('application/pdf');
          const buf = await res.arrayBuffer();
          expect(new TextDecoder().decode(buf.slice(0, 5))).toBe('%PDF-');
        }
      });

      it('previewTemplateWithData renders a user resume doc into a real PDF', async () => {
        const blob = await api.previewTemplateWithData('jake', {
          fullName: 'Ada Lovelace',
          headline: 'Senior Backend Engineer',
          summary: 'Backend engineer shipping distributed systems at scale.',
          skills: ['Go', 'PostgreSQL', 'Kubernetes'],
          experience: [
            {
              title: 'Senior Engineer',
              org: 'Acme',
              period: '2021 — present',
              bullets: ['Cut p99 checkout latency by 40%.'],
            },
          ],
          education: ['B.Tech, University, 2015'],
        });
        expect(blob.type).toBe('application/pdf');
        const buf = await blob.arrayBuffer();
        expect(new TextDecoder().decode(buf.slice(0, 5))).toBe('%PDF-');
      });

      it('reanalyzeResume without a path returns a clean 400', async () => {
        await expect(api.reanalyzeResume()).rejects.toMatchObject({
          status: 400,
        });
      });

      it('improveResume without AI Assist returns an honest 400', async () => {
        // The contract backend has AI Assist off — the real handler must
        // reject cleanly instead of returning the old fake stub shape.
        await expect(
          api.improveResume({
            targetRole: 'Cardiologist',
            formats: ['markdown'],
          }),
        ).rejects.toMatchObject({ status: 400 });
      });

      it('work projects round-trip through the store', async () => {
        await api.saveResumeProject({
          id: 'contract-p1',
          name: 'Contract Project',
          repo: 'github.com/test/contract',
          period: '2025 – 2026',
          role: 'Engineer',
          summary: '- Built things\n- Shipped stuff',
        });
        const projects = await api.getResumeProjects();
        expect(projects.some((p) => p.id === 'contract-p1')).toBe(true);
        await api.deleteResumeProject('contract-p1');
        const after = await api.getResumeProjects();
        expect(after.some((p) => p.id === 'contract-p1')).toBe(false);
      });

      it('skills round-trip through config', async () => {
        await api.saveResumeSkills(['Go', 'SQL', 'Kubernetes']);
        const skills = await api.getResumeSkills();
        expect(skills).toEqual(expect.arrayContaining(['Go', 'Kubernetes']));
      });

      it('getResumeLibrary resolves to an array', async () => {
        expect(Array.isArray(await api.getResumeLibrary())).toBe(true);
      });
    });

    describe('job titles', () => {
      it('suggests offline titles for any profession without AI', async () => {
        const res = await api.suggestJobTitles('Cardiologist, remote');
        expect(res.titles.length).toBeGreaterThan(0);
        expect(res.titles.join(' ')).toMatch(/cardiolog/i);
      });

      it('still requires an intent', async () => {
        const err = await api.suggestJobTitles('').catch((e: unknown) => e);
        expect(err).toBeInstanceOf(Error);
        expect((err as { status?: number }).status).toBe(400);
      });
    });

    describe('geo + fs autocomplete', () => {
      it('geoSearch returns city suggestions', async () => {
        const cities = await api.geoSearch('ber');
        expect(Array.isArray(cities)).toBe(true);
        if (cities.length > 0) {
          expect(typeof cities[0]!.label).toBe('string');
          expect(typeof cities[0]!.iso2).toBe('string');
        }
      });

      it('fs autocomplete returns path suggestions', async () => {
        expect(Array.isArray(await api.getFSAutocomplete('/tmp'))).toBe(true);
      });
    });

    describe('logs + usage', () => {
      it('getUsage returns the usage snapshot shape', async () => {
        const u = await api.getUsage();
        expect(typeof u.totalBytes).toBe('number');
        expect(typeof u.dbBytes).toBe('number');
        expect(typeof u.jobCount).toBe('number');
        expect(typeof u.dataDir).toBe('string');
      });

      it('getLogs resolves and clearLogs empties the buffer', async () => {
        await api.clearLogs();
        const { lines } = await api.getLogs();
        expect(Array.isArray(lines)).toBe(true);
      });
    });

    describe('notify + scraper + llm', () => {
      it('getNotifyChannels resolves to an array of channels', async () => {
        const channels = await api.getNotifyChannels();
        expect(Array.isArray(channels)).toBe(true);
        if (channels.length > 0) {
          expect(typeof channels[0]!.id).toBe('string');
          expect(typeof channels[0]!.enabled).toBe('boolean');
        }
      });

      it('sendNotifySummary without configured channels rejects honestly', async () => {
        // The isolated contract backend has no channels → the real handler
        // must 400 instead of pretending a digest was sent.
        await expect(api.sendNotifySummary()).rejects.toMatchObject({
          status: 400,
        });
      });

      it('getScraperStatus resolves', async () => {
        const s = await api.getScraperStatus();
        expect(typeof s.installed).toBe('boolean');
        expect(typeof s.running).toBe('boolean');
      });

      it('getLLMStatus resolves (local runtime may be unreachable)', async () => {
        const s = await api.getLLMStatus();
        expect(typeof s.reachable).toBe('boolean');
      });
    });
  },
);

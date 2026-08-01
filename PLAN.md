# Nexus UI — Work Tracker

> Living plan for the frontend (`terminal-job-ui`) + the API contract with the
> backend (`../terminal-job`). Each item is a checkbox; update as work lands.
> Verified continuously with `npm run lint`, `npm run build`, `npm test`,
> `npm run test:contract`, `npm run test:e2e`.

## Test & quality plan (agreed scope)

### ✅ Phase 1 — Remove all in-app mock code

- [x] `api.ts` → pure HTTP client (no `USE_MOCK`, no mock datasets)
- [x] Remove `mockSuggestTitles` + honest AI-unavailable errors
- [x] Delete `api.mock.test.ts`, `VITE_USE_MOCK`, docs updated
- [x] Backend contract fixes: `fs.go`/`logs.go` `[]` not `null`; apply-selected consent gate

### ✅ Phase 2 — Contract tests (every `api.ts` method vs real backend)

- [x] `src/lib/api.contract.test.ts` — 34 tests (build + seed + boot real backend)
- [x] `cmd/e2e-seed` in backend repo
- [x] `npm run test:contract` wired

### ✅ Phase 3 — Component-level Vitest coverage (DONE — 33 new tests)

- [x] `src/test/fixtures.ts` (shared mission/config/application factories)
- [x] `DashboardPage.test.tsx` (stats, start/stop, toggles, stale nudge)
- [x] `ConfigPage.test.tsx` (sections, auto-save debounce, save-now)
- [x] `ResumePage.test.tsx` (4 tabs)
- [x] `OutreachPage.test.tsx` (setup default, opt-in gate, save, build queue)
- [x] `ContactsPage.test.tsx` (search, save, saved tab, empty state)
- [x] `CompaniesPage.test.tsx` (empty, add form, refresh)
- [x] `LogsPage.test.tsx` (lines, filter, clear, usage)
- [x] `JobDetailPage.test.tsx` (detail, outcome cycle, not-found)
- [x] Hook invalidation tests (`useApplySelected`, `useSetOutcome`, `useSetApplicationApproved`)

### ✅ Phase 4 — Playwright browser E2E (full journey)

- [x] `playwright.config.ts` + `e2e/global-setup.ts` + `e2e/helpers.ts`
- [x] 11 specs: onboarding, dashboard (start/stop engine), jobs review + consent + outcome, resume skills, config save, companies, contacts, outreach gate, logs/usage
- [x] `npm run test:e2e` wired; `vitest` excludes `e2e/`

### ✅ Phase 5 — Scripts + docs

- [x] `test:contract` / `test:e2e` in `package.json`
- [x] README + AGENTS.md updated

## Product backlog (discovered while testing; not yet done)

### 🔴 Quick wins — fix surfaces that are broken/hollow today

- [x] Resume "New resume" tab (ImproveTab) crash — **defensive shape guard** (backend `/resume/improve` stub ≠ `{previewMD, dir, review}`); real backend handler still TODO
- [x] Outreach Setup key mismatch — **api client normalizes** `maxEmailsDay`/`maxLinkedInDay` → `maxEmailsPerDay`/`maxLinkedInPerDay` (contract-tested)
- [ ] `sendOutreachItem` return shape: backend `{id}` vs `OutreachItem`
- [ ] A11y: ConfigPage labels not associated with inputs (`htmlFor`/`id`)
- [ ] A11y: ConfirmApplyDialog focus trap + Escape + focus restore
- [ ] A11y: filter tabs `aria-pressed` (Jobs/Outreach)

### 🟡 Core flow completion

- [ ] Manual "Add a job" (`/jobs/new` — currently ComingSoon)
- [ ] Dismiss/archive action on queued rows
- [ ] Approve + apply from job detail page
- [ ] Wizard completeness: optional resume + explicit consent on first run

### 🟠 Backend surface completion

- [ ] Real companies CRUD (persist; today a stub)
- [ ] Real contacts OSINT search + saved contacts (today stubs)
- [ ] Real outreach build/send (the Go repo has `internal/outreach`)
- [ ] Real resume improve handler
- [ ] Offline (no-AI) job-title suggestions — profession catalog so onboarding works without API keys

### 🔵 Product leaps (advisory)

- [ ] Profession-aware onboarding (doctor/engineer/designer…)
- [ ] Pipeline kanban: apply → replied → interview → offer (+ reminders)
- [ ] Analytics: response rate, conversion, per-provider yield, CSV export
- [ ] Notifications: run summaries + daily digests via existing Discord/Telegram/email notifier
- [ ] Browser bookmarklet / extension: "send this job to Nexus"
- [ ] Multi-user / auth + cloud sync (strategic decision)

### 🔧 Repo hygiene

- [ ] Push backend `feat/auto-apply-providers` branch (contains the API fixes + `cmd/e2e-seed`)

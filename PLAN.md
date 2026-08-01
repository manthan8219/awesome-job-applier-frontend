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
- [x] `sendOutreachItem` return shape — **typed honestly** as `{ id }` (backend stub echoes the id; UI never reads the payload). Real send handler still backend TODO.
- [x] A11y: ConfigPage labels associated with inputs (`htmlFor`/`id` via `useId`), toggles → `role="switch"` + `aria-checked`, Select → `aria-pressed`, TagInput `aria-label`, Run-time label, ResumeUpload labeled + keyboard dropzone
- [x] A11y: ConfirmApplyDialog focus trap + Escape + focus restore (new `useFocusTrap` hook)
- [x] A11y: filter tabs `aria-pressed` (Jobs filters, Outreach tabs, Contacts tabs)

### 🟡 Core flow completion

- [x] Manual "Add a job" — `JobNewPage` at `/jobs/new` (role/company/url/location/remote → review queue) + `Add job` button on Jobs page. **Requires backend `POST /api/jobs`** (added locally in `../terminal-job` — needs committing there)
- [x] Dismiss/archive action on queued rows — X button marks job `skipped` via backend `POST /api/jobs/{id}/dismiss` (added locally in `../terminal-job`)
- [x] Approve + apply from job detail page — approve toggle + in-context consent apply on `JobDetailPage` (KAN-34)
- [x] Wizard completeness: optional resume + explicit consent on first run (KAN-35)

### 🟠 Backend surface completion

- [x] Real companies CRUD — backend persisted store (`~/.nexus/companies.db`) + GET/PUT/refresh/jobs handlers (KAN-36); frontend Companies page works against real data
- [x] Real contacts OSINT search + saved contacts — `internal/contacts` store + `GET /contacts/search` running the full OSINT finder (KAN-38)
- [x] Real outreach build/send/log — `outreach_notify.go` wired to the Go pipeline: setup from config, idempotent build from applied jobs, real send (honest 400 without creds), audit log (KAN-39)
- [x] Real resume improve handler — `/resume/improve` runs `GenerateImproved` (profile + workcontext + skills), honest 400s without AI/resume, returns the `{previewMD, dir, review}` payload (KAN-40, PRs ready)
- [x] Offline (no-AI) job-title suggestions — profession catalog so onboarding works without API keys (KAN-37)

### ✅ Resume template registry (choose a design, fit the CV into it)

- [x] **Backend template registry** — `internal/resume/template.go`: machine-readable `Template` manifests (id/name/layout/sections/accent/ATS note/one-page/font/rail-side) for **12 curated designs** — Classic, Modern, Sidebar, Compact, Executive (serif), Minimal, Academic (education-first serif), Developer (mono), Split (right rail), Bold, Monochrome (serif), Nordic; `GetTemplate` defaults to Classic (TUI/tailor callers unchanged)
- [x] **Template-aware renderers** — `RenderMarkdownFor` / `RenderLaTeXFor` / `RenderNativePDFFor` follow each manifest (section order, two-column rail on the declared side for Sidebar/Split, accent colors, margins/fonts for Compact, serif/mono body fonts for Executive/Academic/Developer/Monochrome); old `RenderMarkdown`/`RenderLaTeX`/`EnsurePDF`/`RenderNativePDF` kept as Classic wrappers
- [x] **Template-aware AI polish loop** — the creator prompt receives the selected template's sections/order/layout/one-page constraint (`polishTemplateBlock`) and the assessor judges the template-rendered Markdown, so content is written to fit the design
- [x] **API** — `GET /api/resume/templates` (registry) + `POST /api/resume/improve` accepts `templateId` (400 on unknown) and returns `templateId`/`templateName`; version library records the template
- [x] **Frontend** — `ResumeTemplate` types + offline `RESUME_TEMPLATES` fallback (12), `getResumeTemplates()` client + `useResumeTemplates` hook, and a **template gallery** on the New-resume step: responsive 3-column grid of cards with a mini layout preview (header bar, section lines, rail position), accent dot, font badge, layout icon, ATS note and 1-page badge; selection is passed with the generate call
- [x] Gates: backend `go build/vet/test` (68 pkgs) green; frontend lint/build green; vitest (245) incl. contract test for `/resume/templates`; resume e2e spec extended + passing against the real backend

### 🔵 Product leaps (advisory)

- [x] Profession-aware onboarding (doctor/engineer/designer…) — `SuggestProfession` (backend) + detected-profession badge in the onboarding wizard (KAN-44)
- [x] Pipeline kanban: apply → replied → interview → offer — `PipelineBoard` on Jobs (List | Board toggle), move cards via select, persists via the outcome API (KAN-41)
- [x] Analytics: response rate, conversion, per-provider yield, CSV export — `/analytics` page with funnel + rate cards + provider table + export (KAN-42)
- [x] Notifications: channel list + test-send (KAN-43) and **run-summary digest trigger** (KAN-46) — `POST /notify/summary` fans out a real daily-summary event to every configured channel; the only not-yet-automated piece is the *scheduled* digest (TUI scheduler)
- [x] Browser bookmarklet — `/bookmarklet` installer page; pre-fills `/jobs/new` from the page title/URL (KAN-45)
- [x] Multi-user / auth + cloud sync — **deferred by decision (2026-08-01)**. Nexus ships as a single-user control plane; multi-user is a separate architecture project if ever pursued.

### ✅ Jira batch 2026-08-01 (parallel worktree delivery)

- [x] **KAN-21** live keyword-gap panel on job detail — `lib/keywords.ts` extract/diff, `useKeywordGap`, `KeywordGapPanel` (matched/missing chips, one-click add to skills). PR #24
- [x] **KAN-29** guided reply-probability feed + response-rate copy — `lib/opportunities.ts` (fit×freshness×stage), `ReplyProbabilityFeed` on Dashboard, copy shift across Dashboard/Jobs/onboarding. PR #25
- [x] **KAN-20** auto-tailor knobs surfaced on Config — backend engine hook was already merged; added the Tailoring card (`tailorPerJob` toggle + `tailorMaxRounds`). PR #23
- [x] **KAN-28** referral-ask outreach variant — backend setup API exposes `referralAsk`/templates (PR #20) + Outreach Setup UI with custom subject/body templates (PR #26); drafting uses referral templates when enabled
- [x] **KAN-33** record + surface the exact application payload — provider `ApplyResult.Payload` capture (greenhouse/lever), additive `submitted_payload` column + API exposure (PR #21), collapsible `SubmittedPayloadCard` on job detail (PR #27)
- [x] **KAN-17** Outreach/Contacts/Companies real-API wiring — verified end-to-end (05-other-pages spec) and closed
- [x] **KAN-30** dismiss/archive — already shipped as KAN-31; verified (07-dismiss spec) and closed as duplicate
- Every branch gated: lint, build, vitest (148–161), full Playwright suite (22 specs), contract (44), backend `go build/vet/test`. 7 PRs (#23–27 frontend, #20–21 backend) squash-merged to `main`.

### ✅ Jira batch 2026-08-01 (response phase — KAN-19 + KAN-27)

- [x] **KAN-19** per-application response-probability score — `/api/jobs` returns `responseScore`/`responseSummary` (fit × freshness × provider reply probability from the analytics funnel, backend PR #25); Jobs rows + JobDetailPage render the score + why (frontend PR #29); guided feed prefers the backend score
- [x] **KAN-27** Response Center + A/B template testing — `/response` page (overall reply probability, funnel, per-provider reply probability, A/B variant results, recommendation cards) via frontend PR #30; outreach items taggable `Variant A/B` through `PUT /api/outreach/items/{id}/variant` (backend PR #26)
- Gates: backend `go build/vet/test` green; frontend lint/build/vitest (224–226)/full e2e (28 specs)/contract (44) green on both branches and merged `main`.

### 🔧 Repo hygiene

- [x] Push backend `feat/auto-apply-providers` branch — obsolete: its API fixes + `cmd/e2e-seed` all landed via proper PRs; the stale remote branch can be deleted

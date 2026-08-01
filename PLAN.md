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
- [x] **Real template previews (choose a design by seeing it)** — backend `GET /api/resume/templates/{id}/preview.pdf` renders a realistic sample persona (`resume.SampleResume()`) through the exact same PDF engine real resumes use (400 on unknown id); the manifest now carries `headerAlign`/`showRule` tokens (explicit `showRule:false` so no-rule designs round-trip), and the gallery cards render an A4-proportioned **miniature sample resume** — real name/headline/sections/bullets in the template's fonts, accent, header alignment, rule and rail side — plus a per-card "View sample PDF" link to the real backend-rendered document
- [x] Gates: backend `go build/vet/test` (68 pkgs) green; frontend lint/build green; vitest (250) incl. contract tests for `/resume/templates` tokens + the preview-PDF endpoint; resume e2e spec asserts the sample-persona gallery + preview link against the real backend

### ✅ Content fitting (make the CV actually fit the template)

- [x] **Space budgets per template** — every template manifest now declares a `SpaceBudget` (`targetPages`, `maxSummaryLines`, `maxBulletsPerRole`, `maxRoles`, `maxSkills`, `maxEducation`, `charsPerLine`) derived from its geometry: Compact targets 1 page with a 100-char/line budget, Sidebar/Split drop to 60 chars/line for the narrow main column, Developer allows 14 skills, Academic 3 education entries
- [x] **Deterministic planner** — `internal/resume/plan.go` `PlanContent(doc, tpl)`: slots content into the template's declared section order, estimates line usage from `charsPerLine`, caps overflows (top roles/bullets/skills/education, word-boundary summary truncation), and returns a `FitPlan` with planned/target lines, estimated pages, a 0–100 fit score, trimmed sections and warnings — plus the fitted doc the pipeline renders
- [x] **Verified page count** — `RenderNativePDFForCounted` reports the real rendered page count (gofpdf `PageNo()`); `GenerateImproved` renders to a temp path after export, sets `fit.pages`, and adds a warning when a one-page template spills
- [x] **AI writes to the budget** — `polishTemplateBlock` now lists the template's exact caps (summary lines, roles × bullets, chars/line, skills, education) so the creator writes within them instead of relying on the planner to trim
- [x] **API** — `/resume/improve` returns `fit` (`FitPlan`: budget, plannedLines, targetLines, estimatedPages, pages, fitScore, warnings, trimmedSections); `/resume/templates` includes each template's `budget`
- [x] **Frontend** — `ResumeSpaceBudget`/`ResumeFit` types + offline fallback budgets for all 12 templates; template cards show capacity chips (`≤5 roles · ≤4 bullets · ≤12 skills · ≤2 edu`); the result panel shows a **Fit report** (fit score, rendered pages, content lines, trimmed-sections + warnings)
- [x] Gates: backend `go build/vet/test` green (new `plan_test.go` + page-count + API-shape tests); frontend lint/build green; vitest (252) incl. contract assertions on live budgets; resume e2e asserts capacity chips from the real backend

### ✅ PDF preview of generated + your data (see the resume, not the source)

- [x] **Library PDF stream** — `GetVersion(id)` in `library.go` + `GET /api/resume/library/{id}/pdf` streams a generated resume's PDF (`application/pdf`, 404 on unknown); the improve response now returns `pdfId` so the UI can point at it
- [x] **Preview with my data** — `POST /api/resume/templates/{id}/preview` renders a user-supplied resume document (`ImprovedDoc` JSON) into any template with the real PDF engine — no AI, fully deterministic (400 for unknown template or an empty doc); `RenderTemplatePreviewPDFFor(doc, tpl)` powers it
- [x] **Inline PDF pane** — the result panel now defaults to an inline `<object type="application/pdf">` of the generated resume with a PDF/Markdown toggle (markdown stays behind a tab for editing) and an "open in new tab" link; old backends without `pdfId` fall back to markdown
- [x] **Frontend preview-with-data action** — the template gallery has a "Preview with my data" button: assembles `PreviewResumeDoc` from the profile analysis (name, summary, skills, suitable roles) + work projects (roles/bullets) + target role, POSTs it, and shows the rendered PDF inline (blob URL) — lets the user judge their content in a design before spending AI credits
- [x] Gates: backend `go build/vet/test` green (library round-trip, preview-with-data + library-PDF API tests in isolated $HOME); frontend lint/build green; vitest (incl. inline-PDF + preview-with-data component tests, live contract for `previewTemplateWithData`); resume e2e asserts the button against the real backend

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

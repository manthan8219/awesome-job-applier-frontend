# AGENTS.md — Terminal Job UI

> Working guide for any contributor (human or AI agent) touching this frontend.
> Read this before writing code. Follow it when generating code.

## 1. Project overview

`terminal-job-ui` is the web frontend for **Nexus** (`../terminal-job`),
the Go CLI/TUI that automates a job search: it searches 38+ job boards, AI
fit-scores jobs against your résumé, applies for you (with consent + rate
limits), and runs a recruiter outreach pipeline. The TUI is powerful but
terminal-only; this app mirrors the same screens in the browser so usage is
easy. The first screen is the **Mission Control dashboard** (mirrors the TUI's
`internal/ui/dashboard.go`), which lets you:

- See today's apply count vs the daily cap, plus lifetime applied/skipped/failed.
- Watch the onboarding "Ready" checklist (resume, target titles, apply consent, AI).
- Read the current run mode (Queue only / Dry run / Auto apply) and a guided
  next action.
- Start / stop the engine, toggle Dry run and Auto Apply.
- Watch providers (greenhouse, lever, ashby, …) flip through
  searching → done, and a live feed of finds/applies streaming in real time.
- Browse recent applications.

The other TUI tabs (Config, Resume, Jobs, Companies, Outreach, Contacts,
Logs) are routed as "coming soon" placeholders until they are built.

The app talks to the real Nexus backend: start it with `nexus --api` (the Go
binary from the `../terminal-job` repo) and the UI renders the same Mission
Control screens against the live API. The vite dev server proxies `/api` to
`localhost:8080` for you.

## 2. Tech stack

| Concern        | Choice                                   | Why                                   |
| -------------- | ---------------------------------------- | ------------------------------------- |
| Build tool     | Vite 5                                   | Fast HMR, ESM, simple config          |
| UI runtime     | React 18 + TypeScript (strict)           | Component model, strict types        |
| Styling        | Tailwind CSS 3                           | Utility-first, design tokens in config |
| Animation      | Framer Motion                            | Smooth, declarative transitions       |
| Server state   | TanStack React Query 5                   | Caching, polling, mutations          |
| Routing        | React Router 6 (data routers)            | Nested layout routes + `<Outlet/>`   |
| Icons          | lucide-react                             | Tree-shakeable, consistent            |
| Class merging  | clsx + tailwind-merge (`cn`)            | Conflict-free class composition       |
| Lint / format  | ESLint 8 + Prettier                      | Enforced style                        |

Node **>=18** is required.

## 3. Getting started

```bash
# 1. Start the Nexus backend (from ../terminal-job):
go build -o nexus . && ./nexus --api        # serves :8080/api

# 2. Frontend
npm install
cp .env.example .env      # adjust VITE_API_BASE_URL if needed
npm run dev               # http://localhost:5173
npm run build             # type-check (tsc -b) + production build
npm run lint
npm run format
```

## 4. Directory structure

```
src/
├─ components/
│  ├─ ui/          # Generic, reusable primitives (Button, Card, Badge…)
│  ├─ loaders/     # Bespoke animated loaders
│  └─ *.tsx         # Feature components (Sidebar, JobList, LogsTerminal…)
├─ constants/      # Static config: nav items, status metadata
├─ hooks/          # React Query wrappers (useJobs, useCreateJob…)
├─ layouts/        # Route layouts (AppLayout: bg + sidebar + topbar + outlet)
├─ lib/            # api client, utils (cn, formatters)
├─ pages/          # Route-level views (one default export per file)
├─ types/          # Shared domain types (Job, JobStatus, JobLog…)
├─ App.tsx         # Route table
├─ main.tsx        # Providers: React Query + Router
└─ index.css       # Tailwind layers + design-system component classes
```

**Layering rule (imports flow downward only):**
`types` ← `lib` ← `constants` ← `hooks` ← `components` ← `pages/layouts` ← `App`.
Never import a page from a component; never import React Query into a dumb UI
primitive (primitives stay data-source-agnostic).
<!-- END-PART-1 -->

## 5. Coding standards

- **Language:** TypeScript everywhere (`strict: true`,
  `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`).
  No `any` without justification; prefer `unknown` + narrowing.
- **Imports:** use the `@/` path alias (`@/components/ui/Button`).
  Use `import type { … }` for type-only imports (enforced by ESLint).
- **Naming:**
  - Components → `PascalCase` files (`JobList.tsx`), default-export the
    component. Pages must default-export.
  - Hooks → `useXxx`, one hook per file under `hooks/`.
  - Types → `PascalCase` interfaces/types in `types/`.
  - Constants → `UPPER_SNAKE` arrays, `camelCase` objects.
- **Components:** function components only. Props are explicit interfaces,
  no `React.FC`. Use `forwardRef` when a ref is needed (see `Button`).
- **State:** local UI state with `useState`; server state with React Query
  (never duplicate server data into local state). Lift shared state to the
  nearest common parent or a context — not a global.
- **Effects:** prefer derived values (`useMemo`) over `useEffect`. Only
  subscribe to external systems / sync refs in effects. Always include deps.

## 6. Styling (Tailwind) rules

- **Utility-first.** Compose with utilities; extract a reusable class only
  when reused 3+ times — then put it in `@layer components` in `index.css`
  (see `.glass`, `.neon-text`, `.grid-bg`).
- **`cn()` for conditional classes.** Never string-concatenate class names —
  Tailwind's JIT cannot detect dynamically built names and will purge them.
- **Design tokens, not magic values.** Use the `ink` / `neon` / `status`
  palettes from `tailwind.config.js`. New color → add to the config, do not
  hardcode hex in components (loaders' gradient stops are the exception).
- **Dark-first.** The whole UI is dark; do not add light-mode branches unless
  theming is a product requirement.
- **Spacing & radius:** lean on Tailwind's scale; rounded corners use
  `rounded-xl`/`rounded-2xl` for the glassy, futuristic feel.

## 7. Animation guidelines

- Motion is **part of the UX** here — keep it smooth and purposeful.
- Prefer **Framer Motion** for enter/exit/interactive motion; reserve pure-CSS
  keyframes (in `tailwind.config.js`) for infinite loops like loaders
  (`animate-spin-slow`, `animate-pulse-glow`).
- Page transitions use `AnimatePresence mode="wait"` keyed on pathname
  (already wired in `AppLayout`). New pages inherit this for free.
- Animations must respect reduced motion where feasible; keep durations short
  (200–400ms) for layout transitions.
- Loaders live in `components/loaders/` and are exported from its barrel. Pick
  the right one: `OrbitLoader` (full page), `ScanBarLoader` (indeterminate
  progress), `TerminalLoader` (inline, on-brand), `DotWaveLoader` (compact),
  `PulseRingLoader` (calm "thinking").

## 8. Data fetching

- All backend access goes through `lib/api.ts` → consumed via hooks in
  `hooks/`. Components never call `fetch` directly.
- **Query keys** are arrays: `['jobs']`, `['job', id]`, `['job', id, 'logs']`.
  After mutations, invalidate the specific keys you touched (see
  `useCreateJob` / `useCancelJob`).
- **Loading states:** use `PageLoader` at route level, `Skeleton` for partials,
  `Spinner` in buttons. Always handle `error` and `empty` states too.
- **Polling:** stats poll every 5s; running-job logs poll every 2s. Keep polling
  intervals honest and turn them off (`refetchInterval: false`) when idle.

## 9. Accessibility & UX

- Interactive elements must be real `<button>`/`<a>`/`<Link>` with visible
  `:focus-visible` rings (styled globally in `index.css`).
- Loaders carry `role="status"` + `aria-label="Loading"`.
- Maintain color-contrast on text over glass surfaces; don't rely on color
  alone for status — `StatusBadge` pairs a dot + label.
- Keep layouts responsive; the sidebar collapses on `< lg` screens.

## 10. Commit & PR hygiene

- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- Keep PRs focused; run `npm run lint` + `npm run build` + `npm test` before
  pushing — the build type-checks, so a green build means types are sound.
- Run the deeper suites before merging UI changes: `npm run test:contract`
  (every `api.ts` method against the real backend) and `npm run test:e2e`
  (Playwright browser journey). Both need the Go toolchain + the
  `../terminal-job` repo and use an isolated `$HOME`, so your real `~/.nexus`
  data is never touched.
- Don't commit `.env`; only `.env.example`. Keep secrets out of the bundle
  (any `VITE_` var is shipped to the client).

## 11. Do / Don't

✅ Do add a type for every prop and API payload.
✅ Do invalidate queries after mutations.
✅ Do extract a loader/page-transition once, reuse everywhere.
✅ Do keep components small and composed.

❌ Don't `console.log` in committed code.
❌ Don't hardcode API base URLs; use `VITE_API_BASE_URL`.
❌ Don't build Tailwind classes dynamically (purge will drop them).
❌ Don't prop-drill server state; use the React Query cache.


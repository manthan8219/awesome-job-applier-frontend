# Terminal Job · Control Plane UI

A futuristic, glassmorphic control-plane frontend for the **Terminal Job**
orchestration backend. Submit terminal jobs, watch their telemetry, and stream
live output — all wrapped in a smooth, neon, animated interface.

> Built with Vite + React + TypeScript + Tailwind CSS + Framer Motion +
> TanStack React Query.

## ✨ Features

- **Mission overview dashboard** — running / completed / failed counts, average
  duration, and a live success-rate meter.
- **Jobs explorer** — searchable, filterable list with animated rows.
- **Dispatch a job** — name, command, priority, and tags.
- **Job detail** — metadata grid + a terminal-style live log stream.
- **Cancel** running/queued jobs.
- **Bespoke smooth loaders** — orbit, pulse rings, dot-wave, scan bar, and a
  blinking terminal cursor.
- **Real backend** — every screen talks to the Nexus Go API (`nexus --api`)
  through `src/lib/api.ts`; no built-in mock layer.

## 🚀 Quick start

```bash
npm install
cp .env.example .env
npm run dev          # → http://localhost:5173
```

The app requires the **Nexus backend** (the Go CLI repo, `../terminal-job`).
Start it in API mode, then run the UI:

```bash
# 1. Backend (from ../terminal-job)
go build -o nexus . && ./nexus --api          # serves http://localhost:8080/api

# 2. Frontend
npm install
cp .env.example .env
npm run dev                                   # → http://localhost:5173
```

Vite proxies `/api` to `localhost:8080` in dev, so `VITE_API_BASE_URL` only
needs changing when the backend runs elsewhere.

## 📜 Scripts

| Script              | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start the Vite dev server                    |
| `npm run build`     | Type-check (`tsc -b`) and produce a build    |
| `npm run preview`   | Preview the production build locally        |
| `npm run lint`      | Lint with ESLint                             |
| `npm run format`    | Format `src/` with Prettier                  |
| `npm run typecheck` | Type-check only                              |

## 🔌 Backend contract

The UI consumes the Nexus Go API (`nexus --api`), served at `/api` and proxied
by Vite in dev. Full route list in `../terminal-job/internal/api/server.go`.
Primary endpoints used by `src/lib/api.ts`:

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET    | `/api/mission` | Dashboard snapshot (stats, checks, mode, providers, live feed) |
| GET/PUT/PATCH | `/api/config` | Read / save / patch search profile |
| POST/DELETE | `/api/run` | Start / stop the engine |
| POST    | `/api/run/apply-selected` | Submit approved applications |
| GET     | `/api/jobs` | Applications list (supports `?q=`) |
| PATCH   | `/api/jobs/{id}/outcome` | Cycle pipeline outcome |
| POST    | `/api/applications/{id}/approved` | Toggle review-queue approval |
| GET/PUT | `/api/companies`, `/api/contacts/saved`, `/api/outreach/setup` | Companies / contacts / outreach |
| GET     | `/api/logs`, `/api/usage` | Engine log + local footprint |
| GET     | `/api/resume/analyze`, `/api/resume/projects`, `/api/resume/skills` | Resume studio |
| POST    | `/api/job-titles/suggest` | AI title suggestions |

Domain types live in `src/types/` (`index.ts` plus `resume.ts`, `companies.ts`,
`contacts.ts`, `outreach.ts`, `usage.ts`).

## 🧱 Project layout

See [`AGENTS.md`](AGENTS.md) for the full contributor guide, coding standards,
and architecture rules. Short version:

```
src/
├─ components/{ui,loaders}/   # primitives + animations
├─ hooks/                    # React Query wrappers
├─ lib/                      # api client + utils
├─ pages/                    # route views
├─ layouts/                  # app shell
├─ constants/ types/         # config + domain models
└─ index.css                 # Tailwind + design system
```

## 🎨 Design language

Deep-space dark base (`ink` palette), neon cyan/violet accents, glassmorphic
panels with backdrop blur, an animated grid + gradient-orb backdrop, and
gradient text. Reusable surface classes (`.glass`, `.neon-text`, `.grid-bg`,
`.shimmer`) live in `src/index.css`; tokens (colors, keyframes, shadows) live
in `tailwind.config.js`.

## 📄 License

Private / unlicensed for now.

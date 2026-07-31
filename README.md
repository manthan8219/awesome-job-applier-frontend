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
- **Mock mode** — runs fully standalone with synthetic data.

## 🚀 Quick start

```bash
npm install
cp .env.example .env
npm run dev          # → http://localhost:5173
```

The app starts in **mock mode** (`VITE_USE_MOCK=true`) so you can explore it
with no backend. To connect the real backend:

```bash
# .env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_USE_MOCK=false
```

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

Expected REST endpoints (consumed by `src/lib/api.ts`):

| Method | Path                  | Returns              |
| ------ | --------------------- | -------------------- |
| GET    | `/jobs`               | `Job[]`              |
| GET    | `/jobs/:id`           | `Job`                |
| GET    | `/jobs/:id/logs`      | `JobLog[]`           |
| GET    | `/stats`              | `JobStats`           |
| POST   | `/jobs`               | `Job` (created)      |
| POST   | `/jobs/:id/cancel`    | `Job` (cancelled)    |

Domain types live in [`src/types/index.ts`](src/types/index.ts).

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

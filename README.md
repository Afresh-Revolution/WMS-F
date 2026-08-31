# Afresh WMS

Afresh Work Management System — Next.js frontend.

## Stack

- Next.js 16
- React 19
- TypeScript
- Lucide React

## Scripts

```bash
npm install
npm run dev
npm run build
npm start
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) after starting the dev server.

## Production (Render)

| Service | URL |
| --- | --- |
| Frontend | [https://wms-f.onrender.com](https://wms-f.onrender.com) |
| Backend | [https://wms-b.onrender.com](https://wms-b.onrender.com) |

The frontend proxies API traffic to the backend via Next.js rewrites in `next.config.ts`. Set these **environment variables on the frontend Render service** (required at build time):

```env
NEXT_PUBLIC_API_ROOT_URL=https://wms-b.onrender.com
NEXT_PUBLIC_API_BASE_URL=/api/v1
```

Flow in production:

```text
Browser → https://wms-f.onrender.com/api/superadmin/login
       → https://wms-b.onrender.com/api/superadmin/login  (rewrite)
```

After changing env vars on Render, trigger a **new deploy** so `next build` picks up the backend URL.

Local development uses the same variables in `.env` (see `.env.example`).

## Folder structure

```text
src/
  app/
    layout.tsx              # Root HTML / fonts
    page.tsx                # Login page (entry)
    (shell)/                # Shared AppShell layout
      layout.tsx
      dashboard/
      (people)/             # employees, departments, nysc-interns
      (hr)/                 # leave, meetings, promotions, salary-increments
      (work)/               # tasks, target
      (finance)/            # finance-payroll (+ bills, expenses, purchases, vendors)
      (ops)/                # announcements, audit, discipline, events, reports
  components/               # Feature UI and shared layout
  data/                     # Mock / static data
public/                     # Static assets
legacy/                     # Old Vite prototype (not used by Next)
```

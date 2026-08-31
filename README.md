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

## Folder structure

```text
src/
  app/
    layout.tsx              # Root HTML / fonts
    page.tsx                # Redirects to /dashboard
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

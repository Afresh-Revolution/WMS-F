# WMS-F

Afresh Work Management System — React + TypeScript frontend.

## Stack

- React 19
- TypeScript
- Vite
- React Router

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Folder structure

```text
src/
  app/                 # App shell, providers, routes
  assets/              # Static images/icons
  components/
    layout/            # Sidebar, Header, Footer, AppLayout
    ui/                # Shared UI primitives
  features/
    auth/              # Login / register
    dashboard/         # Overview page
    projects/          # Project list & detail
    tasks/             # Task list, board & detail
    teams/             # Teams
    settings/          # Settings
  hooks/               # Shared React hooks
  lib/                 # API helpers, constants, utils
  pages/               # Top-level pages (e.g. 404)
  styles/              # Global CSS
  types/               # Shared TypeScript types
  main.tsx             # Entry point
```

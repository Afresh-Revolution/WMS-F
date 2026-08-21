import type { ReactNode } from 'react'

export function Icon({ children, size = 16 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const afreshIcons = {
  overview: (
    <Icon>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Icon>
  ),
  employees: (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="3" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 4.13a3 3 0 0 1 0 5.75" />
    </Icon>
  ),
  departments: (
    <Icon>
      <path d="M3 21h18" />
      <path d="M6 21V7l6-4 6 4v14" />
      <path d="M10 21v-6h4v6" />
    </Icon>
  ),
  leave: (
    <Icon>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 11h18" />
    </Icon>
  ),
  promotions: (
    <Icon>
      <path d="M4 17 13 8" />
      <path d="M13 8h-6" />
      <path d="M13 8v6" />
      <path d="M20 17a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </Icon>
  ),
  salary: (
    <Icon>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </Icon>
  ),
  meetings: (
    <Icon>
      <path d="M15 10 20 7v10l-5-3" />
      <rect x="3" y="7" width="12" height="10" rx="2" />
    </Icon>
  ),
  tasks: (
    <Icon>
      <path d="M9 11 11 13 15 9" />
      <rect x="3" y="4" width="18" height="16" rx="2" />
    </Icon>
  ),
  targets: (
    <Icon>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
    </Icon>
  ),
  finance: (
    <Icon>
      <path d="M4 10V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3" />
      <path d="M4 10h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M12 14v2" />
    </Icon>
  ),
  events: (
    <Icon>
      <path d="M12 8v4l2.5 1.5" />
      <circle cx="12" cy="13" r="8" />
    </Icon>
  ),
  discipline: (
    <Icon>
      <path d="M12 3 4 7v5c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7z" />
    </Icon>
  ),
  intern: (
    <Icon>
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c3 2 9 2 12 0v-5" />
    </Icon>
  ),
  announcements: (
    <Icon>
      <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z" />
      <path d="M16 8.5a5 5 0 0 1 0 7" />
    </Icon>
  ),
  reports: (
    <Icon>
      <path d="M4 19V9" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M20 19v-4" />
    </Icon>
  ),
  audit: (
    <Icon>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </Icon>
  ),
  access: (
    <Icon>
      <path d="M21 2l-2 2m-7.5 7.5L21 2" />
      <circle cx="8" cy="16" r="5" />
    </Icon>
  ),
  roles: (
    <Icon>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Icon>
  ),
  security: (
    <Icon>
      <path d="M12 3 4 7v5c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  ),
  email: (
    <Icon>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </Icon>
  ),
  bell: (
    <Icon>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </Icon>
  ),
  docs: (
    <Icon>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </Icon>
  ),
  backups: (
    <Icon>
      <path d="M4 6h16v4H4z" />
      <path d="M4 10v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M8 14h.01M12 14h.01" />
    </Icon>
  ),
  health: (
    <Icon>
      <path d="M4 13h4l2-5 4 10 2-5h4" />
    </Icon>
  ),
  logs: (
    <Icon>
      <path d="M4 5h16M4 12h10M4 19h16" />
    </Icon>
  ),
  profile: (
    <Icon>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </Icon>
  ),
  search: (
    <Icon size={15}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icon>
  ),
  help: (
    <Icon>
      <circle cx="12" cy="12" r="8" />
      <path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3.5" />
      <path d="M12 17h.01" />
    </Icon>
  ),
  settings: (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </Icon>
  ),
  signOut: (
    <Icon>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </Icon>
  ),
  location: (
    <Icon size={14}>
      <path d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z" />
      <circle cx="12" cy="11" r="2.5" />
    </Icon>
  ),
  mail: (
    <Icon size={14}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </Icon>
  ),
  grid: (
    <Icon size={14}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </Icon>
  ),
  list: (
    <Icon size={14}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </Icon>
  ),
  signal: (
    <Icon size={18}>
      <path d="M5 18h.01M9 14v4M13 10v8M17 6v12" />
    </Icon>
  ),
  clock: (
    <Icon size={18}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 1.5" />
    </Icon>
  ),
  pulse: (
    <Icon size={18}>
      <path d="M4 13h4l2-5 4 10 2-5h4" />
    </Icon>
  ),
  payroll: (
    <Icon size={18}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </Icon>
  ),
  warning: (
    <Icon size={14}>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 9v5M12 17h.01" />
    </Icon>
  ),
  critical: (
    <Icon size={14}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5M12 16h.01" />
    </Icon>
  ),
  key: (
    <Icon size={18}>
      <circle cx="8" cy="8" r="4" />
      <path d="M11 11 21 21" />
      <path d="M8 8l2 2" />
    </Icon>
  ),
  userPlus: (
    <Icon size={18}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="3" />
      <path d="M19 8v6M22 11h-6" />
    </Icon>
  ),
  briefcase: (
    <Icon size={18}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </Icon>
  ),
  chart: (
    <Icon size={18}>
      <path d="M4 19V9" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M20 19v-4" />
    </Icon>
  ),
  plus: (
    <Icon size={16}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  ),
  people: (
    <Icon size={14}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="3" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 4.13a3 3 0 0 1 0 5.75" />
    </Icon>
  ),
  users: (
    <Icon size={18}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="3" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 4.13a3 3 0 0 1 0 5.75" />
    </Icon>
  ),
  plane: (
    <Icon size={16}>
      <path d="M2 12h5l3 9 4-9h9" />
    </Icon>
  ),
  heart: (
    <Icon size={16}>
      <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.65-7 10-7 10Z" />
    </Icon>
  ),
  parental: (
    <Icon size={16}>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 20a7 7 0 0 1 14 0" />
      <path d="M16 14h4v3" />
    </Icon>
  ),
  close: (
    <Icon size={14}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Icon>
  ),
  check: (
    <Icon size={14}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  ),
  chevron: (
    <Icon size={16}>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  ),
  video: (
    <Icon size={14}>
      <rect x="3" y="7" width="12" height="10" rx="2" />
      <path d="m15 11 6-3v8l-6-3z" />
    </Icon>
  ),
}

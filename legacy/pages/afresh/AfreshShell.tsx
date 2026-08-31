import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { ROUTES } from '../../lib/constants'
import { afreshIcons } from './icons'
import '../afresh-overview.css'

const navRouteMap: Record<string, string> = {
  Overview: ROUTES.overview,
  Employees: ROUTES.employees,
  Departments: ROUTES.departments,
  Leave: ROUTES.leave,
  Promotions: ROUTES.promotions,
  'Salary Increments': ROUTES.salaryIncrements,
  Meetings: ROUTES.meetings,
  Tasks: ROUTES.tasks,
}

const fullNavItems = [
  { label: 'Overview', icon: afreshIcons.overview },
  { label: 'Employees', icon: afreshIcons.employees },
  { label: 'Departments', icon: afreshIcons.departments },
  { label: 'Leave', icon: afreshIcons.leave },
  { label: 'Promotions', icon: afreshIcons.promotions },
  { label: 'Salary Increments', icon: afreshIcons.salary },
  { label: 'Meetings', icon: afreshIcons.meetings },
  { label: 'Tasks', icon: afreshIcons.tasks },
  { label: 'Targets', icon: afreshIcons.targets },
  { label: 'Finance', icon: afreshIcons.finance },
  { label: 'Events', icon: afreshIcons.events },
  { label: 'Discipline', icon: afreshIcons.discipline },
  { label: 'NYSC & Interns', icon: afreshIcons.intern },
  { label: 'Announcements', icon: afreshIcons.announcements, badge: '2' },
  { label: 'Reports', icon: afreshIcons.reports },
  { label: 'Operational Audit Logs', icon: afreshIcons.audit },
  { label: 'User Access', icon: afreshIcons.access },
  { label: 'Roles & Permissions', icon: afreshIcons.roles },
  { label: 'Security', icon: afreshIcons.security },
  { label: 'Email Configuration', icon: afreshIcons.email },
  { label: 'Notification Configuration', icon: afreshIcons.bell },
  { label: 'Document Templates', icon: afreshIcons.docs },
  { label: 'Backups', icon: afreshIcons.backups },
  { label: 'System Health', icon: afreshIcons.health },
  { label: 'Technical Audit Logs', icon: afreshIcons.logs },
  { label: 'Profile', icon: afreshIcons.profile },
]

const compactNavItems = fullNavItems.slice(0, 8)

const sidebarFooter = [
  { label: 'Help center', icon: afreshIcons.help },
  { label: 'Settings', icon: afreshIcons.settings },
  { label: 'Sign out', icon: afreshIcons.signOut },
]

interface AfreshShellProps {
  children: ReactNode
  navVariant?: 'full' | 'compact'
  profileName: string
  profileRole: string
  profileInitials: string
  userInitials?: string
}

function NavItem({
  label,
  icon,
  badge,
}: {
  label: string
  icon: ReactNode
  badge?: string
}) {
  const route = navRouteMap[label]
  const className = ({ isActive }: { isActive: boolean }) =>
    `afresh-nav-item${isActive ? ' active' : ''}`

  if (route) {
    return (
      <NavLink to={route} className={className}>
        {icon}
        <span>{label}</span>
        {badge ? <span className="afresh-nav-badge">{badge}</span> : null}
      </NavLink>
    )
  }

  return (
    <button type="button" className="afresh-nav-item">
      {icon}
      <span>{label}</span>
      {badge ? <span className="afresh-nav-badge">{badge}</span> : null}
    </button>
  )
}

export function AfreshShell({
  children,
  navVariant = 'full',
  profileName,
  profileRole,
  profileInitials,
  userInitials = profileInitials,
}: AfreshShellProps) {
  const navItems = navVariant === 'compact' ? compactNavItems : fullNavItems

  return (
    <div className="afresh">
      <aside className="afresh-sidebar">
        <div className="afresh-logo">
          <span className="afresh-logo-mark">afr</span>
          <span className="afresh-logo-text">afRESH</span>
        </div>

        <div className="afresh-profile">
          <div className="afresh-profile-avatar">{profileInitials}</div>
          <div>
            <h2>{profileName}</h2>
            <p>{profileRole}</p>
          </div>
        </div>

        <nav className="afresh-nav" aria-label="Main">
          {navItems.map((item) => (
            <NavItem key={item.label} label={item.label} icon={item.icon} badge={item.badge} />
          ))}
        </nav>

        <div className="afresh-sidebar-footer">
          {sidebarFooter.map((item) => (
            <button key={item.label} type="button" className="afresh-nav-item">
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="afresh-main">
        <header className="afresh-topbar">
          <p className="afresh-date">Monday, August 3</p>
          <div className="afresh-topbar-actions">
            <label className="afresh-search">
              {afreshIcons.search}
              <span>Search</span>
              <kbd>⌘ K</kbd>
            </label>
            <button type="button" className="afresh-bell" aria-label="Notifications">
              {afreshIcons.bell}
              <span className="afresh-bell-dot" />
            </button>
            <button type="button" className="afresh-user-chip" aria-label="Account">
              {userInitials}
            </button>
          </div>
        </header>

        {children}
      </main>
    </div>
  )
}

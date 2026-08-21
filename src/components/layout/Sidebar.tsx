import { NavLink } from 'react-router-dom'
import { APP_NAME, ROUTES } from '../../lib/constants'

const links = [
  { to: ROUTES.dashboard, label: 'Dashboard' },
  { to: ROUTES.projects, label: 'Projects' },
  { to: ROUTES.tasks, label: 'Tasks' },
  { to: ROUTES.teams, label: 'Teams' },
  { to: ROUTES.settings, label: 'Settings' },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">{APP_NAME}</div>
      <nav className="sidebar-nav" aria-label="Main">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? 'sidebar-link active' : 'sidebar-link'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

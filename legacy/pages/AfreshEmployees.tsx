import { AfreshShell } from './afresh/AfreshShell'
import { afreshIcons } from './afresh/icons'
import './afresh-employees.css'

const filters = [
  'All',
  'Software Engineers',
  'Media/Photography',
  'Hardware',
  'Fashion',
  'Model',
  'HR',
]

const staff = [
  {
    name: 'Nina Patel',
    role: 'Senior Art Director',
    location: 'London',
    department: 'Media/Photography',
    email: 'nina.patel@afresh.co',
    initials: 'NP',
    status: 'Active' as const,
  },
  {
    name: 'Omar Reyes',
    role: 'Staff Software Engineer',
    location: 'Berlin',
    department: 'Software Engineers',
    email: 'omar.reyes@afresh.co',
    initials: 'OR',
    status: 'Active' as const,
  },
  {
    name: 'Lena Fisher',
    role: 'Hardware Lead',
    location: 'Remote',
    department: 'Hardware',
    email: 'lena.fisher@afresh.co',
    initials: 'LF',
    status: 'Active' as const,
  },
  {
    name: 'Theo Grant',
    role: 'Fashion Executive',
    location: 'Lagos',
    department: 'Fashion',
    email: 'theo.grant@afresh.co',
    initials: 'TG',
    status: 'On leave' as const,
  },
  {
    name: 'Maya Chen',
    role: 'Staff Operations',
    location: 'London',
    department: 'HR',
    email: 'maya.chen@afresh.co',
    initials: 'MC',
    status: 'Active' as const,
  },
  {
    name: 'Ravi Kapoor',
    role: 'Model Coordinator',
    location: 'Abuja',
    department: 'Model',
    email: 'ravi.kapoor@afresh.co',
    initials: 'RK',
    status: 'Active' as const,
  },
]

export function AfreshEmployeesPage() {
  return (
    <AfreshShell
      navVariant="compact"
      profileName="Maya Chen"
      profileRole="Super Admin"
      profileInitials="MC"
      userInitials="MC"
    >
      <section className="afresh-directory-head">
        <p className="afresh-directory-kicker">Staff directory</p>
        <h1 className="afresh-directory-title">Everyone, in one considered place</h1>
        <p className="afresh-directory-sub">
          Find colleagues, view profiles, and keep the organisation connected.
        </p>
      </section>

      <div className="afresh-directory-toolbar">
        <input
          className="afresh-staff-search"
          type="search"
          placeholder="Search staff..."
          aria-label="Search staff"
        />
        <div className="afresh-view-toggle" role="group" aria-label="View mode">
          <button type="button" className="afresh-view-btn active">
            {afreshIcons.grid}
            Grid
          </button>
          <button type="button" className="afresh-view-btn">
            {afreshIcons.list}
            List
          </button>
        </div>
      </div>

      <div className="afresh-filters" role="tablist" aria-label="Department filters">
        {filters.map((filter, index) => (
          <button
            key={filter}
            type="button"
            className={`afresh-filter-chip${index === 0 ? ' active' : ''}`}
          >
            {filter}
          </button>
        ))}
      </div>

      <section className="afresh-staff-grid" aria-label="Staff directory">
        {staff.map((person) => (
          <article key={person.email} className="afresh-staff-card">
            <div className="afresh-staff-card-top">
              <div className="afresh-staff-avatar">{person.initials}</div>
              <span
                className={`afresh-staff-status ${
                  person.status === 'On leave' ? 'leave' : 'active'
                }`}
              >
                {person.status}
              </span>
            </div>

            <div>
              <h2 className="afresh-staff-name">{person.name}</h2>
              <p className="afresh-staff-role">{person.role}</p>
            </div>

            <div className="afresh-staff-meta">
              <div className="afresh-staff-meta-row">
                {afreshIcons.location}
                <span>
                  {person.location} · {person.department}
                </span>
              </div>
              <div className="afresh-staff-meta-row">
                {afreshIcons.mail}
                <span>{person.email}</span>
              </div>
            </div>

            <button type="button" className="afresh-staff-profile-btn">
              View profile
            </button>
          </article>
        ))}
      </section>
    </AfreshShell>
  )
}

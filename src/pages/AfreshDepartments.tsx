import { AfreshShell } from './afresh/AfreshShell'
import { afreshIcons } from './afresh/icons'
import './afresh-departments.css'

const tabs = ['All departments', 'Active', 'No HOD']

const departments = [
  {
    name: 'Software Engineers',
    hod: 'Omar Reyes',
    initials: 'OR',
    active: 310,
    targets: 87,
  },
  {
    name: 'Fashion',
    hod: 'Theo Grant',
    initials: 'TG',
    active: 195,
    targets: 72,
  },
  {
    name: 'Media/Photography',
    hod: 'Nina Patel',
    initials: 'NP',
    active: 83,
    targets: 88,
  },
  {
    name: 'Hardware',
    hod: 'Lena Fisher',
    initials: 'LF',
    active: 140,
    targets: 95,
  },
  {
    name: 'HR',
    hod: 'Maya Chen',
    initials: 'MC',
    active: 28,
    targets: 91,
  },
  {
    name: 'Model',
    hod: 'Ravi Kapoor',
    initials: 'RK',
    active: 44,
    targets: 88,
  },
]

export function AfreshDepartmentsPage() {
  return (
    <AfreshShell
      navVariant="compact"
      profileName="Maya Chen"
      profileRole="Super Admin"
      profileInitials="MC"
      userInitials="MC"
    >
      <div className="afresh-dept-head">
        <div className="afresh-dept-head-copy">
          <p className="afresh-dept-kicker">Departments & org structure</p>
          <h1 className="afresh-dept-title">How Afresh is organised</h1>
          <p className="afresh-dept-sub">
            Manage departments, assign heads, and monitor team composition across the company.
          </p>
        </div>
        <button type="button" className="afresh-dept-add">
          {afreshIcons.plus}
          Add department
        </button>
      </div>

      <section className="afresh-dept-stats">
        <article className="afresh-card afresh-dept-stat">
          <p className="afresh-dept-stat-label">Departments</p>
          <p className="afresh-dept-stat-value">6</p>
        </article>
        <article className="afresh-card afresh-dept-stat highlight">
          <p className="afresh-dept-stat-label">Total headcount</p>
          <p className="afresh-dept-stat-value">1,248</p>
        </article>
        <article className="afresh-card afresh-dept-stat">
          <p className="afresh-dept-stat-label">HOD not assigned</p>
          <p className="afresh-dept-stat-value">0</p>
        </article>
      </section>

      <div className="afresh-dept-tabs" role="tablist" aria-label="Department filters">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            className={`afresh-dept-tab${index === 0 ? ' active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="afresh-dept-grid" aria-label="Departments">
        {departments.map((dept) => (
          <article key={dept.name} className="afresh-card afresh-dept-card">
            <div className="afresh-dept-card-top">
              <span className="afresh-dept-icon">{afreshIcons.departments}</span>
              <span className="afresh-chip ok">Active</span>
            </div>

            <h2 className="afresh-dept-name">{dept.name}</h2>

            <div className="afresh-dept-hod">
              <span className="afresh-dept-hod-avatar">{dept.initials}</span>
              <span>{dept.hod}</span>
            </div>

            <div className="afresh-dept-metrics">
              <span className="afresh-dept-active">
                {afreshIcons.people}
                {dept.active} active
              </span>
              <div className="afresh-progress-track">
                <div
                  className="afresh-progress-fill"
                  style={{ width: `${dept.targets}%` }}
                />
              </div>
              <span className="afresh-dept-targets">{dept.targets}% targets</span>
            </div>

            <button type="button" className="afresh-dept-view">
              View department &gt;
            </button>
          </article>
        ))}
      </section>
    </AfreshShell>
  )
}

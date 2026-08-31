const sideNavItems = [
  'Overview',
  'Employees',
  'Departments',
  'Leave',
  'Promotions',
  'Salary Increments',
  'Meetings',
  'Tasks',
  'Targets',
  'Finance',
  'Events',
  'Discipline',
  'NYSC & Interns',
  'Announcements',
  'Reports',
  'Operational Audit Logs',
  'User Access',
  'Roles & Permissions',
  'Security',
  'Email Configuration',
  'Notification Configuration',
  'Document Templates',
  'Backups',
  'System Health',
  'Technical Audit Logs',
  'Profile',
]

const summaryStats = [
  { label: 'Total users', value: '10', tag: 'All roles' },
  { label: 'Active users', value: '8', tag: 'Signed in' },
  { label: 'Inactive users', value: '1', tag: 'Dormant' },
  { label: 'Locked accounts', value: '1', tag: 'Security' },
  { label: 'Failed logins', value: '1', tag: 'Today' },
  { label: 'Admin accounts', value: '2', tag: '1 super' },
]

const serviceStatus = [
  { label: 'Email service', status: 'Operational', icon: '✉' },
  { label: 'Notification service', status: 'Operational', icon: '🔔' },
  { label: 'System health', status: 'Operational', icon: '⟲' },
  { label: 'Backup status', status: 'Completed', meta: '12h ago', icon: '▣' },
]

const alerts = [
  {
    title: 'Role changed',
    subtitle: 'Ravi Kapoor: Accountant + HR (reverted)',
    level: 'warning',
  },
  {
    title: 'Failed login',
    subtitle: 'unknown@afresh.co - IP 102.89.45.21',
    level: 'critical',
  },
  {
    title: 'Service degraded',
    subtitle: 'File Storage latency above threshold',
    level: 'warning',
  },
]

const auditEvents = [
  {
    title: 'Role changed - Security',
    subtitle: 'Ravi Kapoor: Accountant + HR (reverted) - Maya Chen',
    time: '4h ago',
  },
  {
    title: 'Failed login - Security',
    subtitle: 'unknown@afresh.co - IP 102.89.45.21 - System',
    time: '9h ago',
  },
  {
    title: 'Manual backup - Backups',
    subtitle: 'Full database snapshot created - Maya Chen',
    time: '12h ago',
  },
  {
    title: 'Setting updated - Email',
    subtitle: 'SMTP host changed - Maya Chen',
    time: '22h ago',
  },
  {
    title: 'Service degraded - System Health',
    subtitle: 'File Storage latency above threshold - System',
    time: '1d ago',
  },
]

const approvals = [
  {
    title: 'Leave Request',
    subtitle: 'HR - Annual leave - 5 days',
    ref: 'LR-2041',
  },
  {
    title: 'Purchase Request',
    subtitle: 'Admin - Design tooling - annual licences',
    ref: 'PR-8193',
  },
  {
    title: 'Salary Increment',
    subtitle: 'Admin - Salary increment - 12.5%',
    ref: 'SI-8088',
  },
  {
    title: 'Reimbursement',
    subtitle: 'HOD - Reimbursement - conference ticket',
    ref: 'RB-8126',
  },
]

export function OverviewPage() {
  return (
    <div className="overview-screen">
      <aside className="overview-sidebar">
        <div className="overview-brand">
          <span className="overview-brand-icon">afr</span>
          <span className="overview-brand-text">AfrESH</span>
        </div>

        <div className="overview-profile-card">
          <div className="overview-avatar">CI</div>
          <div>
            <h2>Christy Ishaku</h2>
            <p>Super Admin</p>
          </div>
        </div>

        <nav className="overview-nav" aria-label="Overview sections">
          {sideNavItems.map((item) => (
            <button
              key={item}
              className={`overview-nav-item${item === 'Overview' || item === 'Finance' ? ' active' : ''}`}
              type="button"
            >
              <span className="overview-nav-dot" aria-hidden="true" />
              <span>{item}</span>
              {item === 'Announcements' ? (
                <span className="overview-nav-badge">2</span>
              ) : null}
            </button>
          ))}
        </nav>
      </aside>

      <main className="overview-main">
        <header className="overview-topbar">
          <p className="overview-date">Monday, August 3</p>
          <div className="overview-topbar-actions">
            <div className="overview-search" aria-label="Search">
              <span className="overview-search-icon" aria-hidden="true">
                ⌕
              </span>
              <span>Search</span>
              <span className="overview-search-shortcut">⌘ K</span>
            </div>
            <button type="button" className="overview-icon-button" aria-label="Notifications">
              <span aria-hidden="true">!</span>
            </button>
            <button type="button" className="overview-icon-button accent" aria-label="User menu">
              MC
            </button>
          </div>
        </header>

        <section className="overview-hero">
          <div className="overview-hero-copy">
            <p className="overview-eyebrow">Super Admin . System Control</p>
            <h1>Everything is under control.</h1>
            <p className="overview-hero-text">
              Full operational visibility plus complete platform management. You can
              do everything an Admin can - and manage the software itself.
            </p>
          </div>

          <div className="overview-hero-status">
            <p>Platform status</p>
            <strong>99.9% uptime</strong>
          </div>
        </section>

        <section className="overview-summary-grid">
          {summaryStats.map((item) => (
            <article key={item.label} className="overview-stat-card">
              <p>{item.label}</p>
              <div className="overview-stat-row">
                <strong>{item.value}</strong>
                <span>{item.tag}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="overview-service-grid">
          {serviceStatus.map((item) => (
            <article key={item.label} className="overview-service-card">
              <p className="overview-service-title">
                <span className="overview-service-icon" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </p>
              <div className="overview-service-footer">
                <span className="overview-status-pill success">{item.status}</span>
                {item.meta ? <small>{item.meta}</small> : null}
              </div>
            </article>
          ))}
        </section>

        <section className="overview-content-grid">
          <div className="overview-column">
            <article className="overview-panel">
              <div className="overview-panel-header">
                <h2>Technical alerts</h2>
                <button type="button">View logs →</button>
              </div>

              <div className="overview-list">
                {alerts.map((alert) => (
                  <div key={alert.title} className="overview-list-item">
                    <div className="overview-alert-copy">
                      <span
                        className={`overview-alert-icon ${
                          alert.level === 'critical' ? 'critical' : 'warning'
                        }`}
                        aria-hidden="true"
                      >
                        !
                      </span>
                      <div>
                        <h3>{alert.title}</h3>
                        <p>{alert.subtitle}</p>
                      </div>
                    </div>
                    <span className={`overview-status-pill ${alert.level}`}>{alert.level}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="overview-panel">
              <div className="overview-panel-header">
                <h2>Recent technical audit events</h2>
                <button type="button">Full audit →</button>
              </div>

              <div className="overview-audit-list">
                {auditEvents.map((event) => (
                  <div key={event.title} className="overview-audit-item">
                    <div>
                      <h3>{event.title}</h3>
                      <p>{event.subtitle}</p>
                    </div>
                    <span>{event.time}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="overview-column overview-column-side">
            <article className="overview-panel">
              <div className="overview-panel-header">
                <h2>Pending operational approvals</h2>
              </div>

              <p className="overview-panel-note">
                Visibility only. Super Admin is not an approval stage - requests never
                route here automatically.
              </p>

              <div className="overview-approval-list">
                {approvals.map((approval) => (
                  <div key={approval.ref} className="overview-approval-item">
                    <div>
                      <h3>{approval.title}</h3>
                      <p>{approval.subtitle}</p>
                    </div>
                    <span>{approval.ref}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="overview-panel overview-payroll-card">
              <div className="overview-panel-header">
                <h2>Payroll overview</h2>
              </div>

              <p className="overview-payroll-value">N 42.8M</p>
              <p className="overview-payroll-subtitle">July 2026 run - 1,248 employees</p>

              <div className="overview-payroll-row">
                <span>Status</span>
                <span className="overview-status-pill warning">Awaiting Admin approval</span>
              </div>

              <div className="overview-payroll-row">
                <span>Next disbursement</span>
                <strong>Jul 30</strong>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}

export default OverviewPage

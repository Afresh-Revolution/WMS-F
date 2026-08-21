import { AfreshShell } from './afresh/AfreshShell'
import { afreshIcons as icons } from './afresh/icons'
import './afresh-overview.css'

const stats = [
  { label: 'Total users', value: '10', badge: 'All roles' },
  { label: 'Active users', value: '8', badge: 'Signed in' },
  { label: 'Inactive users', value: '1', badge: 'Dormant' },
  { label: 'Locked accounts', value: '1', badge: 'Security' },
  { label: 'Failed logins', value: '1', badge: 'Today' },
  { label: 'Admin accounts', value: '2', badge: '1 super' },
]

const services = [
  { label: 'Email service', status: 'Operational', icon: icons.email },
  { label: 'Notification service', status: 'Operational', icon: icons.bell },
  { label: 'System health', status: 'Operational', icon: icons.health },
  { label: 'Backup status', status: 'Completed', meta: '12h ago', icon: icons.backups },
]

const alerts = [
  {
    title: 'Role changed',
    detail: 'Ravi Kapoor: Accountant → HR (reverted)',
    level: 'warn' as const,
  },
  {
    title: 'Failed login',
    detail: 'unknown@afresh.co · IP 102.89.45.21',
    level: 'crit' as const,
  },
  {
    title: 'Service degraded',
    detail: 'File Storage latency above threshold',
    level: 'warn' as const,
  },
]

const auditEvents = [
  {
    title: 'Role changed · Security',
    detail: 'Ravi Kapoor: Accountant → HR (reverted) — Maya Chen',
    time: '4h ago',
  },
  {
    title: 'Failed login · Security',
    detail: 'unknown@afresh.co · IP 102.89.45.21 — System',
    time: '9h ago',
  },
  {
    title: 'Manual backup · Backups',
    detail: 'Full database snapshot created — Maya Chen',
    time: '12h ago',
  },
  {
    title: 'Setting updated · Email',
    detail: 'SMTP host changed — Maya Chen',
    time: '22h ago',
  },
  {
    title: 'Service degraded · System Health',
    detail: 'File Storage latency above threshold — System',
    time: '1d ago',
  },
]

const approvals = [
  { title: 'Leave Request', detail: 'HR · Annual leave · 5 days', ref: 'LR-2841' },
  { title: 'Purchase Request', detail: 'Admin · Design tooling · annual licences', ref: 'PR-8193' },
  { title: 'Salary Increment', detail: 'Admin · Salary increment · +12.5%', ref: 'SI-8088' },
  { title: 'Reimbursement', detail: 'HOD · Reimbursement · conference ticket', ref: 'RB-0126' },
]

const departmentPerformance = [
  { name: 'Software Engineers', progress: 92 },
  { name: 'Finance', progress: 88 },
  { name: 'Human Resources', progress: 84 },
  { name: 'Media / Photography', progress: 79 },
]

const financialSummary = [
  { label: 'Approved this month', value: '₦ 58.2M' },
  { label: 'Pending purchases', value: '₦ 1.4M' },
  { label: 'Outstanding bills', value: '₦ 920K' },
  { label: 'Reimbursements queued', value: '₦ 210K' },
]

const operationalRecords = [
  { label: 'In review', value: '2' },
  { label: 'Submitted', value: '2' },
  { label: 'Approved', value: '1' },
]

export function AfreshOverviewPage() {
  return (
    <AfreshShell
      profileName="Christy Ishaku"
      profileRole="Super Admin"
      profileInitials="CI"
      userInitials="MC"
    >
      <section className="afresh-hero">
        <div className="afresh-hero-copy">
          <p className="afresh-kicker">Super Admin • System Control</p>
          <h1>Everything is under control.</h1>
          <p>
            Full operational visibility plus complete platform management. You can do
            everything an Admin can — and manage the software itself.
          </p>
        </div>
        <div className="afresh-hero-status">
          <p className="afresh-kicker">Platform status</p>
          <div className="afresh-uptime">
            {icons.signal}
            <span>99.9% uptime</span>
          </div>
        </div>
      </section>

      <section className="afresh-stats">
        {stats.map((stat) => (
          <article key={stat.label} className="afresh-card afresh-stat">
            <p className="afresh-stat-label">{stat.label}</p>
            <div className="afresh-stat-row">
              <span className="afresh-stat-value">{stat.value}</span>
              <span className="afresh-chip peach">{stat.badge}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="afresh-services">
        {services.map((service) => (
          <article key={service.label} className="afresh-card afresh-service">
            <div className="afresh-service-left">
              <span className="afresh-service-icon">{service.icon}</span>
              <p className="afresh-service-name">{service.label}</p>
            </div>
            <div className="afresh-service-meta">
              <span className="afresh-chip ok">{service.status}</span>
              {service.meta ? <small>{service.meta}</small> : null}
            </div>
          </article>
        ))}
      </section>

      <section className="afresh-split">
        <div className="afresh-col">
          <article className="afresh-card afresh-panel">
            <div className="afresh-panel-head">
              <h2 className="afresh-panel-title">
                {icons.clock}
                Technical alerts
              </h2>
              <button type="button" className="afresh-link">
                View logs →
              </button>
            </div>
            {alerts.map((alert) => (
              <div key={alert.title} className="afresh-row">
                <div className="afresh-row-main">
                  <span className={`afresh-alert-icon ${alert.level}`}>
                    {alert.level === 'crit' ? icons.critical : icons.warning}
                  </span>
                  <div>
                    <h3>{alert.title}</h3>
                    <p>{alert.detail}</p>
                  </div>
                </div>
                <span className={`afresh-chip ${alert.level}`}>
                  {alert.level === 'crit' ? 'critical' : 'warning'}
                </span>
              </div>
            ))}
          </article>

          <article className="afresh-card afresh-panel">
            <div className="afresh-panel-head">
              <h2 className="afresh-panel-title">
                {icons.pulse}
                Recent technical audit events
              </h2>
              <button type="button" className="afresh-link">
                Full audit →
              </button>
            </div>
            {auditEvents.map((event) => (
              <div key={event.title} className="afresh-row">
                <div>
                  <h3>{event.title}</h3>
                  <p>{event.detail}</p>
                </div>
                <span className="afresh-time">{event.time}</span>
              </div>
            ))}
          </article>
        </div>

        <div className="afresh-col">
          <article className="afresh-card afresh-panel">
            <div className="afresh-panel-head">
              <h2 className="afresh-panel-title">
                {icons.clock}
                Pending operational approvals
              </h2>
            </div>
            <p className="afresh-note">
              Visibility only. Super Admin is not an approval stage — requests never route
              here automatically.
            </p>
            {approvals.map((item) => (
              <div key={item.ref} className="afresh-row">
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </div>
                <span className="afresh-ref">{item.ref}</span>
              </div>
            ))}
          </article>

          <article className="afresh-card afresh-panel afresh-payroll">
            <div className="afresh-panel-head">
              <h2 className="afresh-panel-title">
                {icons.payroll}
                Payroll overview
              </h2>
            </div>
            <p className="afresh-payroll-value">₦ 42.8M</p>
            <p className="afresh-payroll-sub">July 2026 run · 1,248 employees</p>
            <span className="afresh-chip warn">Awaiting Admin approval</span>
            <div className="afresh-payroll-foot">
              <span>Next disbursement</span>
              <strong>Jul 30</strong>
            </div>
          </article>
        </div>
      </section>

      <section className="afresh-split afresh-bottom">
        <div className="afresh-col">
          <div className="afresh-duo">
            <article className="afresh-card afresh-panel">
              <div className="afresh-panel-head">
                <h2 className="afresh-panel-title">
                  {icons.key}
                  Permission changes
                </h2>
                <button type="button" className="afresh-link">
                  Manage →
                </button>
              </div>
              <div className="afresh-empty">No recent changes.</div>
            </article>

            <article className="afresh-card afresh-panel">
              <div className="afresh-panel-head">
                <h2 className="afresh-panel-title">
                  {icons.userPlus}
                  Role changes
                </h2>
                <button type="button" className="afresh-link">
                  User access →
                </button>
              </div>
              <div className="afresh-role-change">
                <h3>Ravi Kapoor: Accountant → HR (reverted)</h3>
                <span>4h ago</span>
              </div>
            </article>
          </div>

          <article className="afresh-card afresh-panel">
            <div className="afresh-panel-head">
              <h2 className="afresh-panel-title">
                {icons.briefcase}
                Department performance
              </h2>
              <button type="button" className="afresh-link">
                Reports →
              </button>
            </div>
            <div className="afresh-performance-list">
              {departmentPerformance.map((dept) => (
                <div key={dept.name} className="afresh-performance-item">
                  <div className="afresh-performance-head">
                    <span>{dept.name}</span>
                    <strong>{dept.progress}%</strong>
                  </div>
                  <div className="afresh-progress-track">
                    <div
                      className="afresh-progress-fill"
                      style={{ width: `${dept.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="afresh-col">
          <article className="afresh-card afresh-panel">
            <div className="afresh-panel-head">
              <h2 className="afresh-panel-title">
                {icons.chart}
                Financial summary
              </h2>
            </div>
            <div className="afresh-finance-list">
              {financialSummary.map((item) => (
                <div key={item.label} className="afresh-finance-row">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="afresh-card afresh-panel afresh-records">
            <div className="afresh-panel-head">
              <h2 className="afresh-panel-title">
                {icons.users}
                Operational records
              </h2>
            </div>
            <div className="afresh-records-grid">
              {operationalRecords.map((record) => (
                <div key={record.label} className="afresh-record-tile">
                  <strong>{record.value}</strong>
                  <span>{record.label}</span>
                </div>
              ))}
            </div>
            <p className="afresh-records-note">
              Super Admin retains 6 full platform permissions.
            </p>
          </article>
        </div>
      </section>
    </AfreshShell>
  )
}

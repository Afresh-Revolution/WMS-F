import { AfreshShell } from './afresh/AfreshShell'
import { afreshIcons } from './afresh/icons'
import './afresh-salary.css'

const stats = [
  { label: 'Total', value: '3' },
  { label: 'Under review', value: '1', highlight: true },
  { label: 'Approved', value: '1' },
  { label: 'Avg increment', value: '12.5%' },
]

const tabs = ['All', 'Under Review', 'Approved']

const increments = [
  {
    name: 'Nina Patel',
    initials: 'NP',
    department: 'Media/Photography',
    from: '₦ 620,000',
    to: '₦ 697,500',
    percent: '+12.5%',
    effective: 'Aug 1, 2026',
    status: 'review' as const,
    statusLabel: 'Under Admin Review',
  },
  {
    name: 'Omar Reyes',
    initials: 'OR',
    department: 'Software Engineers',
    from: '₦ 710,000',
    to: '₦ 816,500',
    percent: '+15%',
    effective: 'Aug 1, 2026',
    status: 'draft' as const,
    statusLabel: 'Draft',
  },
  {
    name: 'Lena Fisher',
    initials: 'LF',
    department: 'Hardware',
    from: '₦ 395,000',
    to: '₦ 434,500',
    percent: '+10%',
    effective: 'Jul 1, 2026',
    status: 'approved' as const,
    statusLabel: 'Approved',
  },
]

export function AfreshSalaryIncrementsPage() {
  return (
    <AfreshShell
      navVariant="compact"
      profileName="Maya Chen"
      profileRole="Super Admin"
      profileInitials="MC"
      userInitials="MC"
    >
      <section className="afresh-salary-head">
        <p className="afresh-salary-kicker">Salary increments</p>
        <h1 className="afresh-salary-title">Reward performance, fairly</h1>
        <p className="afresh-salary-sub">
          Create salary increment recommendations, track approval stages, and apply approved
          changes on time.
        </p>
      </section>

      <section className="afresh-salary-stats">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className={`afresh-card afresh-salary-stat${stat.highlight ? ' highlight' : ''}`}
          >
            <p className="afresh-salary-stat-label">{stat.label}</p>
            <p className="afresh-salary-stat-value">{stat.value}</p>
          </article>
        ))}
      </section>

      <div className="afresh-salary-tabs" role="tablist" aria-label="Increment filters">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            className={`afresh-salary-tab${index === 0 ? ' active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <article className="afresh-card afresh-salary-panel">
        <div className="afresh-salary-panel-head">
          <h2>Increment recommendations</h2>
        </div>

        {increments.map((item) => (
          <div key={item.name} className="afresh-salary-row">
            <div className="afresh-salary-person">
              <span className="afresh-salary-avatar">{item.initials}</span>
              <div>
                <h3>{item.name}</h3>
                <p className="afresh-salary-path">
                  {item.department} · {item.from} → <em>{item.to}</em>
                </p>
                <p className="afresh-salary-dates">
                  {item.percent} · Eff. {item.effective}
                </p>
              </div>
            </div>

            <div className="afresh-salary-meta">
              <span className="afresh-salary-percent">{item.percent}</span>
              <span className={`afresh-salary-status ${item.status}`}>{item.statusLabel}</span>
              <span className="afresh-salary-chevron">{afreshIcons.chevron}</span>
            </div>
          </div>
        ))}
      </article>
    </AfreshShell>
  )
}

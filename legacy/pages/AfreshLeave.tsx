import { AfreshShell } from './afresh/AfreshShell'
import { afreshIcons } from './afresh/icons'
import './afresh-leave.css'

const balances = [
  {
    label: 'Annual leave',
    icon: afreshIcons.plane,
    left: '13 left',
    used: 12,
    total: 25,
  },
  {
    label: 'Sick leave',
    icon: afreshIcons.heart,
    left: '7 left',
    used: 3,
    total: 10,
  },
  {
    label: 'Parental',
    icon: afreshIcons.parental,
    left: '90 left',
    used: 0,
    total: 90,
  },
  {
    label: 'Personal',
    icon: afreshIcons.briefcase,
    left: '3 left',
    used: 2,
    total: 5,
  },
]

const leaveTabs = ['Requests', 'My leave', 'Team calendar']

const requests = [
  {
    name: 'Nina Patel',
    initials: 'NP',
    detail: 'Annual leave · Aug 4 – Aug 8 · 5 days',
    status: 'pending' as const,
  },
  {
    name: 'Omar Reyes',
    initials: 'OR',
    detail: 'Sick leave · Jul 29 · 1 day',
    status: 'pending' as const,
  },
  {
    name: 'Lena Fisher',
    initials: 'LF',
    detail: 'Personal · Aug 12 · 1 day',
    status: 'approved' as const,
  },
  {
    name: 'Theo Grant',
    initials: 'TG',
    detail: 'Annual leave · Sep 1 – Sep 5 · 5 days',
    status: 'declined' as const,
  },
]

export function AfreshLeavePage() {
  return (
    <AfreshShell
      navVariant="compact"
      profileName="Maya Chen"
      profileRole="Super Admin"
      profileInitials="MC"
      userInitials="MC"
    >
      <section className="afresh-leave-head">
        <p className="afresh-leave-kicker">Leave & wellbeing</p>
        <h1 className="afresh-leave-title">Time away, thoughtfully managed</h1>
        <p className="afresh-leave-sub">
          Request time off, track balances, and keep your team covered — all in one calm place.
        </p>
      </section>

      <section className="afresh-leave-balances">
        {balances.map((balance) => (
          <article key={balance.label} className="afresh-card afresh-leave-balance">
            <div className="afresh-leave-balance-top">
              <span className="afresh-leave-balance-icon">{balance.icon}</span>
              <span className="afresh-leave-left">{balance.left}</span>
            </div>
            <h2>{balance.label}</h2>
            <div className="afresh-leave-balance-foot">
              <div className="afresh-progress-track">
                <div
                  className="afresh-progress-fill"
                  style={{ width: `${(balance.used / balance.total) * 100}%` }}
                />
              </div>
              <span>
                {balance.used} of {balance.total} days used
              </span>
            </div>
          </article>
        ))}
      </section>

      <div className="afresh-leave-tabs" role="tablist" aria-label="Leave views">
        {leaveTabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            className={`afresh-leave-tab${index === 0 ? ' active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <article className="afresh-card afresh-leave-panel">
        <div className="afresh-leave-panel-head">
          <h2>Leave requests</h2>
          <p>Review and respond to your team&apos;s requests.</p>
        </div>

        {requests.map((request) => (
          <div key={request.name} className="afresh-leave-row">
            <div className="afresh-leave-person">
              <span className="afresh-leave-avatar">{request.initials}</span>
              <div>
                <h3>{request.name}</h3>
                <p>{request.detail}</p>
              </div>
            </div>

            <div className="afresh-leave-actions">
              {request.status === 'pending' ? (
                <>
                  <span className="afresh-leave-status pending">Pending</span>
                  <button type="button" className="afresh-leave-reject" aria-label="Decline">
                    {afreshIcons.close}
                  </button>
                  <button type="button" className="afresh-leave-approve">
                    {afreshIcons.check}
                    Approve
                  </button>
                </>
              ) : (
                <span className={`afresh-leave-status ${request.status}`}>
                  {request.status === 'approved' ? 'Approved' : 'Declined'}
                </span>
              )}
            </div>
          </div>
        ))}
      </article>
    </AfreshShell>
  )
}

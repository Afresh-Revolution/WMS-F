import { useState } from 'react'
import { AfreshShell } from './afresh/AfreshShell'
import { afreshIcons } from './afresh/icons'
import './afresh-promotions.css'

const stats = [
  { label: 'Total', value: '4' },
  { label: 'Under review', value: '1', highlight: true },
  { label: 'Approved', value: '1' },
  { label: 'Drafts', value: '1' },
]

const tabs = ['All', 'Under Admin Review', 'Approved', 'Draft', 'Rejected']

const employees = [
  'Nina Patel',
  'Omar Reyes',
  'Lena Fisher',
  'Theo Grant',
  'Maya Chen',
  'Ravi Kapoor',
]

const recommendations = [
  {
    name: 'Nina Patel',
    initials: 'NP',
    from: 'Art Director',
    to: 'Senior Art Director',
    department: 'Media/Photography',
    submitted: 'Jul 24',
    effective: 'Aug 1, 2026',
    status: 'review' as const,
    statusLabel: 'Under Admin Review',
  },
  {
    name: 'Lena Fisher',
    initials: 'LF',
    from: 'Hardware Specialist',
    to: 'Hardware Lead',
    department: 'Hardware',
    submitted: 'Jul 20',
    effective: 'Aug 15, 2026',
    status: 'draft' as const,
    statusLabel: 'Draft',
  },
  {
    name: 'Ravi Kapoor',
    initials: 'RK',
    from: 'Model Coordinator',
    to: 'Senior Model Coordinator',
    department: 'Model',
    submitted: 'Jun 30',
    effective: 'Jul 1, 2026',
    status: 'approved' as const,
    statusLabel: 'Approved',
  },
  {
    name: 'Theo Grant',
    initials: 'TG',
    from: 'Fashion Executive',
    to: 'Fashion Manager',
    department: 'Fashion',
    submitted: 'Jun 15',
    effective: 'Jul 1, 2026',
    status: 'rejected' as const,
    statusLabel: 'Rejected',
  },
]

export function AfreshPromotionsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<(typeof recommendations)[number] | null>(null)

  function openRecommendation(item: (typeof recommendations)[number]) {
    setSelected(item)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  return (
    <AfreshShell
      navVariant="compact"
      profileName="Maya Chen"
      profileRole="Super Admin"
      profileInitials="MC"
      userInitials="MC"
    >
      <section className="afresh-promo-head">
        <p className="afresh-promo-kicker">Promotion management</p>
        <h1 className="afresh-promo-title">Recognise and advance your people</h1>
        <p className="afresh-promo-sub">
          Create promotion recommendations, track approval progress, and record career
          milestones.
        </p>
      </section>

      <section className="afresh-promo-stats">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className={`afresh-card afresh-promo-stat${stat.highlight ? ' highlight' : ''}`}
          >
            <p className="afresh-promo-stat-label">{stat.label}</p>
            <p className="afresh-promo-stat-value">{stat.value}</p>
          </article>
        ))}
      </section>

      <div className="afresh-promo-tabs" role="tablist" aria-label="Promotion filters">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            className={`afresh-promo-tab${index === 0 ? ' active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <article className="afresh-card afresh-promo-panel">
        <div className="afresh-promo-panel-head">
          <h2>Promotion recommendations</h2>
        </div>

        {recommendations.map((item) => (
          <button
            key={item.name}
            type="button"
            className="afresh-promo-row"
            onClick={() => openRecommendation(item)}
          >
            <div className="afresh-promo-person">
              <span className="afresh-promo-avatar">{item.initials}</span>
              <div>
                <h3>{item.name}</h3>
                <p className="afresh-promo-path">
                  {item.from} → <em>{item.to}</em> · {item.department}
                </p>
                <p className="afresh-promo-dates">
                  Submitted {item.submitted} · Eff. {item.effective}
                </p>
              </div>
            </div>

            <div className="afresh-promo-meta">
              <span className={`afresh-promo-status ${item.status}`}>{item.statusLabel}</span>
              <span className="afresh-promo-chevron">{afreshIcons.chevron}</span>
            </div>
          </button>
        ))}
      </article>

      {modalOpen ? (
        <div className="afresh-promo-backdrop" role="presentation" onClick={closeModal}>
          <div
            className="afresh-promo-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="afresh-promo-modal-head">
              <h2 id="promo-modal-title">New promotion recommendation</h2>
              <button
                type="button"
                className="afresh-promo-modal-close"
                aria-label="Close"
                onClick={closeModal}
              >
                {afreshIcons.close}
              </button>
            </header>

            <form
              className="afresh-promo-form"
              onSubmit={(event) => {
                event.preventDefault()
                closeModal()
              }}
            >
              <label className="afresh-promo-field">
                <span>Employee</span>
                <select defaultValue={selected?.name ?? ''} key={selected?.name ?? 'new'}>
                  <option value="" disabled>
                    Select employee
                  </option>
                  {employees.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="afresh-promo-field-row">
                <label className="afresh-promo-field">
                  <span>Current position</span>
                  <input
                    type="text"
                    placeholder="Current title"
                    defaultValue={selected?.from ?? ''}
                  />
                </label>
                <label className="afresh-promo-field">
                  <span>Proposed position</span>
                  <input
                    type="text"
                    placeholder="New title"
                    defaultValue={selected?.to ?? ''}
                  />
                </label>
              </div>

              <label className="afresh-promo-field">
                <span>Reason for recommendation</span>
                <textarea placeholder="Performance summary and justification" rows={4} />
              </label>

              <label className="afresh-promo-field">
                <span>Recommended effective date</span>
                <input type="text" defaultValue={selected?.effective ?? ''} />
              </label>

              <div className="afresh-promo-modal-actions">
                <button type="button" className="afresh-promo-draft" onClick={closeModal}>
                  Save as draft
                </button>
                <button type="submit" className="afresh-promo-submit">
                  Submit to Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AfreshShell>
  )
}

import { AfreshShell } from './afresh/AfreshShell'
import { afreshIcons } from './afresh/icons'
import './afresh-meetings.css'

const stats = [
  { label: "Today's meetings", value: '3' },
  { label: 'This week', value: '5', highlight: true },
  { label: 'Company-wide', value: '1' },
]

const tabs = ['Upcoming', 'Completed', 'Company-wide', 'All']

const meetings = [
  {
    month: 'Jul',
    day: '28',
    title: 'Executive briefing',
    tags: ['Upcoming'],
    time: '10:00 AM · 1h',
    location: 'Boardroom A',
    virtual: false,
    attendees: '3 attendees',
  },
  {
    month: 'Jul',
    day: '29',
    title: 'Design team weekly sync',
    tags: ['Upcoming'],
    time: '10:00 AM · 30m',
    location: 'Meeting Room 2',
    virtual: false,
    attendees: '3 attendees',
  },
  {
    month: 'Jul',
    day: '29',
    title: 'HR leave review',
    tags: ['Upcoming'],
    time: '2:30 PM · 45m',
    location: 'Virtual (Google Meet)',
    virtual: true,
    attendees: '2 attendees',
  },
  {
    month: 'Aug',
    day: '5',
    title: 'All-hands company meeting',
    tags: ['Upcoming', 'Company-wide'],
    time: '10:00 AM · 1.5h',
    location: 'Virtual (Google Meet)',
    virtual: true,
    attendees: null,
  },
]

export function AfreshMeetingsPage() {
  return (
    <AfreshShell
      navVariant="compact"
      profileName="Maya Chen"
      profileRole="Super Admin"
      profileInitials="MC"
      userInitials="MC"
    >
      <section className="afresh-meet-head">
        <p className="afresh-meet-kicker">Meetings & calendar</p>
        <h1 className="afresh-meet-title">Every meeting, in its place</h1>
        <p className="afresh-meet-sub">
          Schedule, manage, and track meetings for management and the wider team.
        </p>
      </section>

      <section className="afresh-meet-stats">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className={`afresh-card afresh-meet-stat${stat.highlight ? ' highlight' : ''}`}
          >
            <p className="afresh-meet-stat-label">{stat.label}</p>
            <p className="afresh-meet-stat-value">{stat.value}</p>
          </article>
        ))}
      </section>

      <div className="afresh-meet-tabs" role="tablist" aria-label="Meeting filters">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            className={`afresh-meet-tab${index === 0 ? ' active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="afresh-meet-list" aria-label="Upcoming meetings">
        {meetings.map((meeting) => (
          <article key={`${meeting.title}-${meeting.day}`} className="afresh-card afresh-meet-card">
            <div className="afresh-meet-date">
              <span>{meeting.month}</span>
              <strong>{meeting.day}</strong>
            </div>

            <div className="afresh-meet-body">
              <div className="afresh-meet-title-row">
                <h2>{meeting.title}</h2>
                {meeting.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`afresh-meet-tag${tag === 'Company-wide' ? ' company' : ''}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="afresh-meet-meta">
                <span>
                  {afreshIcons.clock}
                  {meeting.time}
                </span>
                <span>
                  {meeting.virtual ? afreshIcons.video : afreshIcons.location}
                  {meeting.location}
                </span>
                {meeting.attendees ? (
                  <span>
                    {afreshIcons.people}
                    {meeting.attendees}
                  </span>
                ) : null}
              </div>
            </div>

            <button type="button" className="afresh-meet-details">
              Details
            </button>
          </article>
        ))}
      </section>
    </AfreshShell>
  )
}

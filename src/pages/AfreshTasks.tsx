import { AfreshShell } from './afresh/AfreshShell'
import { afreshIcons } from './afresh/icons'
import './afresh-tasks.css'

const stats = [
  { label: 'Open tasks', value: '6', badge: 'Active', badgeTone: 'peach' },
  { label: 'Overdue', value: '1', badge: 'Urgent', badgeTone: 'crit', highlight: 'urgent' },
  { label: 'In progress', value: '3', badge: 'Now', badgeTone: 'peach' },
  { label: 'Completed', value: '1', badge: 'Total', badgeTone: 'muted' },
]

const tabs = ['All', 'In Progress', 'Overdue', 'Completed']

const tasks = [
  {
    title: 'Redesign onboarding flow',
    description: 'Refresh the new-hire journey so every department starts with the same considered experience.',
    priority: 'High',
    status: 'In Progress',
    assignee: 'Nina Patel',
    initials: 'NP',
    due: 'Due Jul 31',
    department: 'Media/Photography',
  },
  {
    title: 'Update employee handbook',
    description: 'Incorporate the new leave policy and remote-work guidance for Q3.',
    priority: 'High',
    status: 'In Progress',
    assignee: 'Maya Chen',
    initials: 'MC',
    due: 'Due Aug 4',
    department: 'HR',
  },
  {
    title: 'Q3 fashion campaign assets',
    description: 'Deliver lookbook photography and social cutdowns for the autumn collection.',
    priority: 'Medium',
    status: 'Not Started',
    assignee: 'Theo Grant',
    initials: 'TG',
    due: 'Due Aug 12',
    department: 'Fashion',
  },
  {
    title: 'Submit July timesheet',
    description: 'Close out hours for the July payroll run before finance lock.',
    priority: 'High',
    status: 'Overdue',
    assignee: 'Omar Reyes',
    initials: 'OR',
    due: 'Due Jul 31 · 3d overdue',
    department: 'Software Engineers',
  },
  {
    title: 'Security training completion',
    description: 'Finish the mandatory platform security module and confirm completion in HR.',
    priority: 'Medium',
    status: 'In Progress',
    assignee: 'Lena Fisher',
    initials: 'LF',
    due: 'Due Aug 8',
    department: 'Hardware',
  },
  {
    title: 'Q2 vendor review summary',
    description: 'Compile vendor performance notes and flag any contracts due for renewal.',
    priority: 'Low',
    status: 'Not Started',
    assignee: 'Ravi Kapoor',
    initials: 'RK',
    due: 'Due Aug 18',
    department: 'Model',
  },
  {
    title: 'Review updated leave policy',
    description: 'Sign off the revised leave policy before it is published to the handbook.',
    priority: 'Medium',
    status: 'Completed',
    assignee: 'Maya Chen',
    initials: 'MC',
    due: 'Due Jul 28',
    department: 'HR',
  },
]

function statusClass(status: string) {
  if (status === 'Overdue') return 'overdue'
  if (status === 'Completed') return 'done'
  if (status === 'In Progress') return 'progress'
  return 'idle'
}

function priorityClass(priority: string) {
  if (priority === 'High') return 'high'
  if (priority === 'Low') return 'low'
  return 'medium'
}

export function AfreshTasksPage() {
  return (
    <AfreshShell
      navVariant="compact"
      profileName="Maya Chen"
      profileRole="Super Admin"
      profileInitials="MC"
      userInitials="MC"
    >
      <section className="afresh-task-head">
        <p className="afresh-task-kicker">Tasks</p>
        <h1 className="afresh-task-title">Work that moves forward</h1>
        <p className="afresh-task-sub">
          Create, assign, and track tasks across individuals, departments, and the whole company.
        </p>
      </section>

      <section className="afresh-task-stats">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className={`afresh-card afresh-task-stat${stat.highlight ? ` ${stat.highlight}` : ''}`}
          >
            <p className="afresh-task-stat-label">{stat.label}</p>
            <div className="afresh-task-stat-row">
              <p className="afresh-task-stat-value">{stat.value}</p>
              <span className={`afresh-task-badge ${stat.badgeTone}`}>{stat.badge}</span>
            </div>
          </article>
        ))}
      </section>

      <div className="afresh-task-tabs" role="tablist" aria-label="Task filters">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            className={`afresh-task-tab${index === 0 ? ' active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="afresh-task-list" aria-label="Task list">
        {tasks.map((task) => {
          const completed = task.status === 'Completed'

          return (
            <article
              key={task.title}
              className={`afresh-card afresh-task-card${completed ? ' completed' : ''}`}
            >
              <span className={`afresh-task-check${completed ? ' checked' : ''}`} aria-hidden="true">
                {completed ? afreshIcons.check : null}
              </span>

              <div className="afresh-task-body">
                <div className="afresh-task-title-row">
                  <h2>{task.title}</h2>
                  <span className={`afresh-task-chip ${priorityClass(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`afresh-task-chip ${statusClass(task.status)}`}>
                    {task.status === 'Overdue' ? 'Overdue' : task.status}
                  </span>
                </div>
                <p className="afresh-task-desc">{task.description}</p>
                <div className="afresh-task-meta">
                  <span className="afresh-task-assignee">
                    <span className="afresh-task-avatar">{task.initials}</span>
                    {task.assignee}
                  </span>
                  <span>
                    {afreshIcons.clock}
                    {task.due}
                  </span>
                  <span>{task.department}</span>
                </div>
              </div>
            </article>
          )
        })}
      </section>
    </AfreshShell>
  )
}

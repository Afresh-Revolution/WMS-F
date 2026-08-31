import { Card } from '../../../components/ui'

const stats = [
  { label: 'Active projects', value: '12' },
  { label: 'Open tasks', value: '48' },
  { label: 'Team members', value: '16' },
]

export function StatsOverview() {
  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <p className="stat-label">{stat.label}</p>
          <p className="stat-value">{stat.value}</p>
        </Card>
      ))}
    </div>
  )
}

import { Card } from '../../../components/ui'

const activity = [
  'Design review completed for Website Redesign',
  'New task assigned: Update onboarding docs',
  'Team Alpha added two members',
]

export function RecentActivity() {
  return (
    <Card title="Recent activity">
      <ul className="activity-list">
        {activity.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Card>
  )
}

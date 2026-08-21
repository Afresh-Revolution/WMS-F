import { Link } from 'react-router-dom'
import type { Task } from '../../../types'
import { Card } from '../../../components/ui'

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Card>
      <h3>
        <Link to={`/tasks/${task.id}`}>{task.title}</Link>
      </h3>
      <p className="muted">{task.description}</p>
      <div className="meta-row">
        <span className="badge">{task.status.replace('_', ' ')}</span>
        <span className="badge badge-priority">{task.priority}</span>
      </div>
    </Card>
  )
}

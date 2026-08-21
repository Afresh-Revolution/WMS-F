import type { Task } from '../../../types'
import { TaskCard } from './TaskCard'

interface TaskListProps {
  tasks: Task[]
}

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="muted">No tasks yet.</p>
  }

  return (
    <div className="cards-grid">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  )
}

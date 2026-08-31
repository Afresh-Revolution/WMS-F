import type { Task, TaskStatus } from '../../../types'
import { TaskCard } from './TaskCard'

const columns: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']

interface TaskBoardProps {
  tasks: Task[]
}

export function TaskBoard({ tasks }: TaskBoardProps) {
  return (
    <div className="board">
      {columns.map((status) => (
        <section key={status} className="board-column">
          <h3 className="board-column-title">{status.replace('_', ' ')}</h3>
          <div className="stack">
            {tasks
              .filter((task) => task.status === status)
              .map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}

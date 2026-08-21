import { useState } from 'react'
import { Header } from '../../../components/layout'
import { Button, Modal } from '../../../components/ui'
import type { Task } from '../../../types'
import { TaskBoard } from '../components/TaskBoard'
import { TaskForm } from '../components/TaskForm'
import { TaskList } from '../components/TaskList'

const sampleTasks: Task[] = [
  {
    id: 't1',
    title: 'Draft wireframes',
    description: 'Create low-fidelity layouts for dashboard',
    status: 'in_progress',
    priority: 'high',
    projectId: '1',
    assigneeId: 'u1',
    createdAt: '2026-07-10T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 't2',
    title: 'API contract review',
    description: 'Align frontend types with backend schema',
    status: 'todo',
    priority: 'medium',
    projectId: '1',
    createdAt: '2026-07-12T00:00:00.000Z',
    updatedAt: '2026-07-12T00:00:00.000Z',
  },
  {
    id: 't3',
    title: 'QA checklist',
    description: 'Prepare release checklist for MVP',
    status: 'review',
    priority: 'urgent',
    projectId: '2',
    createdAt: '2026-07-18T00:00:00.000Z',
    updatedAt: '2026-07-28T00:00:00.000Z',
  },
]

export function TasksPage() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'list' | 'board'>('board')

  return (
    <div className="page">
      <Header title="Tasks" subtitle="Manage work across projects" />
      <div className="page-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setView(view === 'board' ? 'list' : 'board')}
        >
          {view === 'board' ? 'List view' : 'Board view'}
        </Button>
        <Button type="button" onClick={() => setOpen(true)}>
          New task
        </Button>
      </div>
      {view === 'board' ? (
        <TaskBoard tasks={sampleTasks} />
      ) : (
        <TaskList tasks={sampleTasks} />
      )}
      <Modal open={open} title="Create task" onClose={() => setOpen(false)}>
        <TaskForm
          onSubmit={(title, description, priority) => {
            console.info('create task', { title, description, priority })
            setOpen(false)
          }}
        />
      </Modal>
    </div>
  )
}

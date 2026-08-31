import type { FormEvent } from 'react'
import { useState } from 'react'
import { Button, Input } from '../../../components/ui'
import type { TaskPriority } from '../../../types'

interface TaskFormProps {
  onSubmit: (title: string, description: string, priority: TaskPriority) => void
}

export function TaskForm({ onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit(title, description, priority)
    setTitle('')
    setDescription('')
    setPriority('medium')
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <Input
        label="Title"
        name="title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
      />
      <Input
        label="Description"
        name="description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <label className="field">
        <span className="field-label">Priority</span>
        <select
          className="field-input"
          value={priority}
          onChange={(event) => setPriority(event.target.value as TaskPriority)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </label>
      <Button type="submit">Create task</Button>
    </form>
  )
}

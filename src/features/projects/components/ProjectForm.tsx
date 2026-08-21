import type { FormEvent } from 'react'
import { useState } from 'react'
import { Button, Input } from '../../../components/ui'

interface ProjectFormProps {
  onSubmit: (name: string, description: string) => void
}

export function ProjectForm({ onSubmit }: ProjectFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit(name, description)
    setName('')
    setDescription('')
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <Input
        label="Project name"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <Input
        label="Description"
        name="description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <Button type="submit">Create project</Button>
    </form>
  )
}

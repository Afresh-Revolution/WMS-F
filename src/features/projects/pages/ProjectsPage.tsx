import { useState } from 'react'
import { Header } from '../../../components/layout'
import { Button, Modal } from '../../../components/ui'
import type { Project } from '../../../types'
import { ProjectForm } from '../components/ProjectForm'
import { ProjectList } from '../components/ProjectList'

const sampleProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Refresh marketing site and onboarding flows',
    status: 'active',
    ownerId: 'u1',
    memberIds: ['u1', 'u2'],
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Mobile App MVP',
    description: 'Ship first release of the field ops app',
    status: 'on_hold',
    ownerId: 'u2',
    memberIds: ['u2', 'u3'],
    createdAt: '2026-06-15T00:00:00.000Z',
    updatedAt: '2026-07-20T00:00:00.000Z',
  },
]

export function ProjectsPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="page">
      <Header title="Projects" subtitle="Track and organize workstreams" />
      <div className="page-actions">
        <Button type="button" onClick={() => setOpen(true)}>
          New project
        </Button>
      </div>
      <ProjectList projects={sampleProjects} />
      <Modal open={open} title="Create project" onClose={() => setOpen(false)}>
        <ProjectForm
          onSubmit={(name, description) => {
            console.info('create project', { name, description })
            setOpen(false)
          }}
        />
      </Modal>
    </div>
  )
}

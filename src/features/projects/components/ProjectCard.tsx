import { Link } from 'react-router-dom'
import type { Project } from '../../../types'
import { Card } from '../../../components/ui'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card>
      <h3>
        <Link to={`/projects/${project.id}`}>{project.name}</Link>
      </h3>
      <p className="muted">{project.description}</p>
      <p className="badge">{project.status.replace('_', ' ')}</p>
    </Card>
  )
}

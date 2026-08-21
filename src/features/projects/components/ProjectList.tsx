import type { Project } from '../../../types'
import { ProjectCard } from './ProjectCard'

interface ProjectListProps {
  projects: Project[]
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return <p className="muted">No projects yet.</p>
  }

  return (
    <div className="cards-grid">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

import type { Project } from '../../types'
import { apiRequest } from '../../lib/api'

export function fetchProjects() {
  return apiRequest<Project[]>('/projects')
}

export function fetchProject(projectId: string) {
  return apiRequest<Project>(`/projects/${projectId}`)
}

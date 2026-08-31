import type { Task } from '../../types'
import { apiRequest } from '../../lib/api'

export function fetchTasks(projectId?: string) {
  const query = projectId ? `?projectId=${projectId}` : ''
  return apiRequest<Task[]>(`/tasks${query}`)
}

export function fetchTask(taskId: string) {
  return apiRequest<Task>(`/tasks/${taskId}`)
}

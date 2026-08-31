export type UserRole = 'admin' | 'manager' | 'member'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
}

export interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'on_hold' | 'completed'
  ownerId: string
  memberIds: string[]
  createdAt: string
  updatedAt: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  projectId: string
  assigneeId?: string
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface Team {
  id: string
  name: string
  description: string
  memberIds: string[]
}

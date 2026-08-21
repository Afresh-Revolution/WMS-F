import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../../components/layout'
import { LoginPage, RegisterPage } from '../../features/auth'
import { DashboardPage } from '../../features/dashboard'
import { ProjectDetailPage, ProjectsPage } from '../../features/projects'
import { SettingsPage } from '../../features/settings'
import { TaskDetailPage } from '../../features/tasks'
import { TeamsPage } from '../../features/teams'
import { ROUTES } from '../../lib/constants'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { AfreshOverviewPage } from '../../pages/AfreshOverview'
import { AfreshEmployeesPage } from '../../pages/AfreshEmployees'
import { AfreshDepartmentsPage } from '../../pages/AfreshDepartments'
import { AfreshLeavePage } from '../../pages/AfreshLeave'
import { AfreshPromotionsPage } from '../../pages/AfreshPromotions'
import { AfreshSalaryIncrementsPage } from '../../pages/AfreshSalaryIncrements'
import { AfreshMeetingsPage } from '../../pages/AfreshMeetings'
import { AfreshTasksPage } from '../../pages/AfreshTasks'

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.register} element={<RegisterPage />} />
      <Route path="/" element={<Navigate to={ROUTES.overview} replace />} />
      <Route path={ROUTES.overview} element={<AfreshOverviewPage />} />
      <Route path={ROUTES.employees} element={<AfreshEmployeesPage />} />
      <Route path={ROUTES.departments} element={<AfreshDepartmentsPage />} />
      <Route path={ROUTES.leave} element={<AfreshLeavePage />} />
      <Route path={ROUTES.promotions} element={<AfreshPromotionsPage />} />
      <Route path={ROUTES.salaryIncrements} element={<AfreshSalaryIncrementsPage />} />
      <Route path={ROUTES.meetings} element={<AfreshMeetingsPage />} />
      <Route path={ROUTES.tasks} element={<AfreshTasksPage />} />

      <Route element={<AppLayout />}>
        <Route path={ROUTES.dashboard} element={<DashboardPage />} />
        <Route path={ROUTES.projects} element={<ProjectsPage />} />
        <Route path={ROUTES.projectDetail} element={<ProjectDetailPage />} />
        <Route path={ROUTES.taskDetail} element={<TaskDetailPage />} />
        <Route path={ROUTES.teams} element={<TeamsPage />} />
        <Route path={ROUTES.settings} element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

import { Header } from '../../../components/layout'
import { RecentActivity } from '../components/RecentActivity'
import { StatsOverview } from '../components/StatsOverview'

export function DashboardPage() {
  return (
    <div className="page">
      <Header
        title="Dashboard"
        subtitle="Overview of projects, tasks, and team activity"
      />
      <StatsOverview />
      <RecentActivity />
    </div>
  )
}

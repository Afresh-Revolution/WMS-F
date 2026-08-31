import { useParams } from 'react-router-dom'
import { Header } from '../../../components/layout'
import { Card } from '../../../components/ui'

export function TaskDetailPage() {
  const { taskId } = useParams()

  return (
    <div className="page">
      <Header title="Task detail" subtitle={`Task ID: ${taskId}`} />
      <Card title="Details">
        <p className="muted">Task metadata, comments, and activity will appear here.</p>
      </Card>
    </div>
  )
}

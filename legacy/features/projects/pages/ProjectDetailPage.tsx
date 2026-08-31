import { useParams } from 'react-router-dom'
import { Header } from '../../../components/layout'
import { Card } from '../../../components/ui'

export function ProjectDetailPage() {
  const { projectId } = useParams()

  return (
    <div className="page">
      <Header title="Project detail" subtitle={`Project ID: ${projectId}`} />
      <Card title="Overview">
        <p className="muted">Project details and related tasks will appear here.</p>
      </Card>
    </div>
  )
}

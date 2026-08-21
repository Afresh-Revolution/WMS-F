import { Header } from '../../../components/layout'
import type { Team } from '../../../types'
import { TeamList } from '../components/TeamList'

const sampleTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Product',
    description: 'Owns roadmap and delivery',
    memberIds: ['u1', 'u2', 'u3'],
  },
  {
    id: 'team-2',
    name: 'Engineering',
    description: 'Builds and maintains the platform',
    memberIds: ['u2', 'u4', 'u5'],
  },
]

export function TeamsPage() {
  return (
    <div className="page">
      <Header title="Teams" subtitle="People collaborating across projects" />
      <TeamList teams={sampleTeams} />
    </div>
  )
}

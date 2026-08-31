import type { Team } from '../../../types'
import { Card } from '../../../components/ui'

interface TeamMemberCardProps {
  team: Team
}

export function TeamMemberCard({ team }: TeamMemberCardProps) {
  return (
    <Card title={team.name}>
      <p className="muted">{team.description}</p>
      <p>{team.memberIds.length} members</p>
    </Card>
  )
}

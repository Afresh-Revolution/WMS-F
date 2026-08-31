import type { Team } from '../../../types'
import { TeamMemberCard } from './TeamMemberCard'

interface TeamListProps {
  teams: Team[]
}

export function TeamList({ teams }: TeamListProps) {
  if (teams.length === 0) {
    return <p className="muted">No teams yet.</p>
  }

  return (
    <div className="cards-grid">
      {teams.map((team) => (
        <TeamMemberCard key={team.id} team={team} />
      ))}
    </div>
  )
}

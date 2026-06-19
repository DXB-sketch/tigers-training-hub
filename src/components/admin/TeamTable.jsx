import StatusPill from '../shared/StatusPill'
import './TeamTable.css'

function getTeamStatus(team) {
  if (!team.coachId) return 'no-coach'
  if (!team.currentPlanId) return 'no-plan'
  return team.currentPlanStatus === 'published' ? 'published' : 'draft'
}

function getActionLabel(status) {
  if (status === 'no-coach') return 'Fix'
  if (status === 'no-plan') return 'Assign'
  return 'Edit'
}

export default function TeamTable({ teams, onSelectTeam, selectedTeamId }) {
  return (
    <div className="teams-table-wrap">
      <table className="teams-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>Coach</th>
            <th className="hide-mobile">This week's plan</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {teams.map(team => {
            const status = getTeamStatus(team)
            const actionLabel = getActionLabel(status)
            const isSelected = team.id === selectedTeamId
            const planLabel = team.currentPlanTitle
              ? `${team.currentPlanTitle} — Wk ${team.currentPlanWeek}`
              : null

            return (
              <tr
                key={team.id}
                className={`team-row team-row--${status}`}
                onClick={() => onSelectTeam?.(team)}
                style={isSelected ? { background: 'var(--tigers-gold-pale)' } : {}}
              >
                <td><div className="team-name-cell">{team.name}</div></td>
                <td>
                  {team.coachName
                    ? <span className="coach-name">{team.coachName}</span>
                    : <span className="no-coach">No coach assigned</span>
                  }
                </td>
                <td className="hide-mobile">
                  {planLabel ?? '—'}
                </td>
                <td><StatusPill status={status} /></td>
                <td>
                  <button className="row-action">{actionLabel}</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

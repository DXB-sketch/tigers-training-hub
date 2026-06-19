import { useNavigate } from 'react-router-dom'
import supabase from '../../lib/supabase'
import './CoachDetailPanel.css'

export default function CoachDetailPanel({ coach, allAssignments, allTeams, role, onChanged }) {
  const navigate = useNavigate()

  if (!coach) {
    return (
      <div className="cdp-panel cdp-panel--empty">
        <div className="cdp-empty-msg">Select a coach to view details</div>
      </div>
    )
  }

  const coachAssignments = allAssignments.filter(a => a.coach_id === coach.id)
  const assignedTeamIds = new Set(coachAssignments.map(a => a.team_id))
  const availableTeams = allTeams.filter(t => !assignedTeamIds.has(t.id))

  async function handleRemove(assignment) {
    await supabase.from('coach_assignments').delete().eq('id', assignment.id)
    // Maintain the single-primary invariant: if the removed coach was primary
    // and other coaches remain on that team, promote the first remaining.
    if (assignment.is_primary) {
      const remaining = allAssignments.filter(
        a => a.team_id === assignment.team_id && a.id !== assignment.id
      )
      if (remaining.length > 0) {
        await supabase
          .from('coach_assignments')
          .update({ is_primary: true })
          .eq('id', remaining[0].id)
      }
    }
    onChanged()
  }

  async function handleAssign(teamId) {
    if (!teamId) return
    const hasOthers = allAssignments.some(a => a.team_id === teamId)
    await supabase
      .from('coach_assignments')
      .insert({ coach_id: coach.id, team_id: teamId, is_primary: !hasOthers })
    onChanged()
  }

  return (
    <div className="cdp-panel">
      <div className="cdp-header">
        <div className="cdp-name">{coach.name}</div>
        <div className="cdp-email">{coach.email}</div>
        <div className="cdp-phone">{coach.phone_number || '--'}</div>
      </div>

      <div className="cdp-section">
        <div className="cdp-section-head">Team assignments</div>

        {coachAssignments.length === 0 ? (
          <div className="cdp-empty-assign">Not assigned to any team</div>
        ) : (
          coachAssignments.map(a => (
            <div key={a.id} className="cdp-assign-row">
              <div className="cdp-assign-info">
                <span className="cdp-assign-ag">{a.age_group_name || 'No age group'}</span>
                <span className="cdp-assign-team">{a.team_name}</span>
              </div>
              <div className="cdp-assign-actions">
                <span className={`cdp-pill cdp-pill--${a.is_primary ? 'primary' : 'assistant'}`}>
                  {a.is_primary ? 'Primary' : 'Assistant'}
                </span>
                <button className="cdp-remove-btn" onClick={() => handleRemove(a)}>×</button>
              </div>
            </div>
          ))
        )}

        {availableTeams.length > 0 && (
          <select
            className="cdp-assign-select"
            value=""
            onChange={e => handleAssign(e.target.value)}
          >
            <option value="">Assign to team…</option>
            {availableTeams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      {role === 'president' && (
        <div className="cdp-section cdp-section--last">
          <button
            className="cdp-edit-account"
            onClick={() => navigate(`/president?userId=${coach.id}`)}
          >
            Edit account →
          </button>
        </div>
      )}
    </div>
  )
}

import { Link } from 'react-router-dom'
import StatusPill from '../shared/StatusPill'
import './TeamDetailPanel.css'

export default function TeamDetailPanel({ team, coach, currentPlan, loading }) {
  if (!team && !loading) {
    return (
      <div className="detail-panel detail-panel--empty">
        <div className="detail-empty-msg">Select a team to view details</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="detail-panel">
        <div style={{ padding: '24px', fontSize: 12, color: 'var(--ink-faint)' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="detail-panel">
      <div className="dp-header">
        <div className="dp-header-row">
          <div className="dp-team-name">{team.name}</div>
          <button className="dp-edit-btn">Edit team</button>
        </div>
      </div>

      <div className="dp-section">
        <div className="dp-section-label">Coach</div>
        {coach ? (
          <>
            <div className="dp-field">
              <div className="dp-field-label">Name</div>
              <div className="dp-field-val">{coach.name}</div>
            </div>
            <div className="dp-field">
              <div className="dp-field-label">Email</div>
              <div className="dp-field-val dp-field-val--secondary">{coach.email}</div>
            </div>
          </>
        ) : (
          <div className="dp-field">
            <div className="dp-field-val dp-field-val--muted">No coach assigned</div>
          </div>
        )}
      </div>

      <div className="dp-section">
        <div className="dp-section-label">Current plan</div>
        {currentPlan ? (
          <>
            <div className="dp-field">
              <div className="dp-field-label">Assigned</div>
              <div className="dp-field-val">{currentPlan.title} — Week {currentPlan.weekNumber}</div>
            </div>
            <div className="dp-field">
              <div className="dp-field-label">Status</div>
              <div className="dp-field-val">
                <StatusPill status={currentPlan.status} />
              </div>
            </div>
            <div className="dp-field">
              <div className="dp-field-label">Duration</div>
              <div className="dp-field-val dp-field-val--secondary">
                {currentPlan.durationMinutes} min
              </div>
            </div>
            <button className="dp-assign-btn">View plan</button>
            <button className="dp-assign-btn dp-assign-btn--secondary">Change plan</button>
          </>
        ) : (
          <>
            <div className="dp-field">
              <div className="dp-field-val dp-field-val--muted">No plan assigned</div>
            </div>
            <button className="dp-assign-btn">Assign a plan</button>
          </>
        )}
      </div>

      <div className="dp-section">
        <div className="dp-section-label">Team details</div>
        <div className="dp-field">
          <div className="dp-field-label">Age group</div>
          <div className="dp-field-val dp-field-val--secondary">{team.age_group_name}</div>
        </div>
        <div className="dp-field">
          <div className="dp-field-label">Training day</div>
          <div className="dp-field-val dp-field-val--secondary">
            {team.trainingDay}s, {team.trainingTime}
          </div>
        </div>
        <div className="dp-field">
          <div className="dp-field-label">Registered players</div>
          <div className="dp-field-val dp-field-val--secondary">{team.playerCount} players</div>
        </div>
      </div>

      <div className="dp-section">
        <Link className="dp-sessions-link" to={`/admin/teams/${team.id}/plans`}>
          View published sessions →
        </Link>
      </div>
    </div>
  )
}

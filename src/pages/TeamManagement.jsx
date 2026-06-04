import { useState } from 'react'
import TopNav from '../components/layout/TopNav'
import PageHeader from '../components/layout/PageHeader'
import TeamDetailPanel from '../components/admin/TeamDetailPanel'
import StatusPill from '../components/shared/StatusPill'
import { useTeams } from '../hooks/useTeams'
import { useTeam } from '../hooks/useTeam'
import './TeamManagement.css'

function getTeamStatus(team) {
  if (!team.coachId) return 'no-coach'
  if (!team.currentPlanId) return 'no-plan'
  return team.currentPlanStatus === 'published' ? 'live' : 'draft'
}

function getActionLabel(status) {
  if (status === 'no-coach') return 'Fix'
  if (status === 'no-plan') return 'Assign'
  return 'Edit'
}

export default function TeamManagement() {
  const { teams, loading: teamsLoading, error: teamsError } = useTeams()
  const [selectedId, setSelectedId] = useState(null)
  const { team, coach, currentPlan, loading: detailLoading } = useTeam(selectedId)

  return (
    <div>
      <TopNav />
      <PageHeader
        title="Teams"
        subtitle="Manage coaches, contacts and plan assignments"
        action={<button className="primary-btn">+ Add team</button>}
      />

      {teamsError && (
        <div style={{ padding: '16px 24px', fontSize: 12, color: 'var(--ink-mid)' }}>
          Could not load teams. Check your connection.&nbsp;
          <a href="#" onClick={e => { e.preventDefault(); window.location.reload() }}>Try again</a>
        </div>
      )}

      {teamsLoading && (
        <div style={{ padding: '16px 24px', fontSize: 12, color: 'var(--ink-faint)' }}>Loading...</div>
      )}

      {!teamsError && !teamsLoading && (
        <div className="team-mgmt-layout">
          <div className="team-list-panel">
            <div className="team-list-head">
              <span>Team</span>
              <span>Coach</span>
              <span>Current plan</span>
              <span>Status</span>
              <span></span>
            </div>

            {teams.map(t => {
              const status = getTeamStatus(t)
              const isSelected = t.id === selectedId
              const planLabel = t.currentPlanTitle
                ? `${t.currentPlanTitle} Wk ${t.currentPlanWeek}`
                : null

              return (
                <div
                  key={t.id}
                  className={`team-row${isSelected ? ' selected' : ''}`}
                  onClick={() => setSelectedId(t.id)}
                >
                  <div className="tr-name">{t.name}</div>
                  <div>
                    {t.coachName
                      ? <span className="tr-coach">{t.coachName}</span>
                      : <span className="tr-no-coach">Unassigned</span>
                    }
                  </div>
                  <div>
                    {planLabel
                      ? <span className="tr-plan">{planLabel}</span>
                      : <span className="tr-no-plan">No plan assigned</span>
                    }
                  </div>
                  <div><StatusPill status={status} /></div>
                  <div>
                    <button className="tr-action" onClick={e => e.stopPropagation()}>
                      {getActionLabel(status)}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <TeamDetailPanel
            team={team}
            coach={coach}
            currentPlan={currentPlan}
            loading={!!selectedId && detailLoading}
          />
        </div>
      )}
    </div>
  )
}

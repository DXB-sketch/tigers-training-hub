import { useNavigate } from 'react-router-dom'
import TopNav from '../components/layout/TopNav'
import PageHeader from '../components/layout/PageHeader'
import TeamTable from '../components/admin/TeamTable'
import { useTeams } from '../hooks/useTeams'
import { usePlans } from '../hooks/usePlans'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { teams, loading: teamsLoading, error: teamsError } = useTeams()
  const { plans, loading: plansLoading, error: plansError } = usePlans()

  const loading = teamsLoading || plansLoading
  const error   = teamsError || plansError

  const totalTeams     = teams.length
  const activeCoaches  = new Set(teams.filter(t => t.coachId).map(t => t.coachId)).size
  const published      = plans.filter(p => p.status === 'published').length
  const draft          = plans.filter(p => p.status === 'draft').length
  const needsAttention = teams.filter(t => !t.coachId || !t.currentPlanId).length

  const recentPlans = plans.slice(0, 3)

  function dash(val) { return loading ? '—' : val }

  return (
    <div>
      <TopNav />
      <PageHeader
        title="Dashboard"
        subtitle="Wednesday, 4 June 2026 · Week 4 in progress"
        action={
          <button className="primary-btn" onClick={() => navigate('/admin/plans')}>
            + New training plan
          </button>
        }
      />

      <div className="stats-row">
        <div className="stat-cell">
          <div className="stat-label">Teams</div>
          <div className="stat-num">{dash(totalTeams)}</div>
          <div className="stat-sub">All age groups</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Active coaches</div>
          <div className="stat-num">{dash(activeCoaches)}</div>
          <div className="stat-sub">Across all teams</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Plans this week</div>
          <div className="stat-num stat-num--gold">{dash(plans.length)}</div>
          <div className="stat-sub">{dash(published)} published, {dash(draft)} draft</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Needs attention</div>
          <div className="stat-num">{dash(needsAttention)}</div>
          <div className="stat-sub">Unassigned teams</div>
        </div>
      </div>

      <div className="section-label">
        All teams
        <button className="section-action" onClick={() => navigate('/admin/teams')}>
          Manage teams
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px 24px', fontSize: 12, color: 'var(--ink-mid)' }}>
          Could not load teams. Check your connection.&nbsp;
          <a href="#" onClick={e => { e.preventDefault(); window.location.reload() }}>Try again</a>
        </div>
      )}

      {!error && !loading && teams.length === 0 && (
        <div style={{ padding: '24px', fontSize: 13, color: 'var(--ink-muted)', textAlign: 'center' }}>
          No teams found. Add a team to get started.
        </div>
      )}

      {!error && (loading || teams.length > 0) && (
        <TeamTable teams={teams} />
      )}

      <div className="section-label">
        Recent training plans
        <button className="section-action" onClick={() => navigate('/admin/plans')}>
          View all plans
        </button>
      </div>

      {plansLoading && (
        <div style={{ padding: '16px 24px', fontSize: 12, color: 'var(--ink-faint)' }}>Loading...</div>
      )}

      {!plansLoading && !plansError && (
        <div className="plans-block">
          {recentPlans.map(plan => {
            const actionLabel = plan.status === 'published' ? 'Open' : 'Edit'
            return (
              <div
                key={plan.id}
                className="plan-row"
                onClick={() => navigate(`/admin/plans/${plan.id}`)}
              >
                <div className="plan-week">{plan.weekNumber}</div>
                <div className="plan-body">
                  <div className="plan-name">
                    {plan.title} — {plan.teamName}
                  </div>
                  <div className="plan-meta">
                    {plan.drillCount} drills &nbsp;&middot;&nbsp; {plan.durationMinutes} min
                    &nbsp;&middot;&nbsp; Created {plan.createdAt}
                  </div>
                </div>
                <div className="plan-action">{actionLabel}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

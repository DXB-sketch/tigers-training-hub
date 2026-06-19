import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopNav from '../components/layout/TopNav'
import PageHeader from '../components/layout/PageHeader'
import { useTeam } from '../hooks/useTeam'
import { usePlans } from '../hooks/usePlans'
import { useDrills } from '../hooks/useDrills'
import './TeamPlanView.css'

function PlanDrillList({ planId }) {
  const navigate = useNavigate()
  const { drills, loading } = useDrills(planId)

  if (loading) {
    return <div className="tpv-drill-loading">Loading drills...</div>
  }
  if (!drills.length) {
    return <div className="tpv-drill-empty">No drills in this plan.</div>
  }

  return (
    <div className="tpv-drill-list">
      {drills.map((drill, i) => (
        <div
          key={drill.id}
          className="tpv-drill-item"
          onClick={() => navigate(`/admin/plans/${planId}/preview`)}
        >
          <span className="tpv-drill-num">{i + 1}</span>
          <span className="tpv-drill-title">{drill.title}</span>
          {drill.duration && <span className="tpv-drill-meta">{drill.duration}</span>}
          <span className="tpv-drill-arrow">→</span>
        </div>
      ))}
    </div>
  )
}

export default function TeamPlanView() {
  const { teamId } = useParams()
  const { team, loading: teamLoading } = useTeam(teamId)
  const { plans, loading: plansLoading } = usePlans({ teamId, status: 'published' })
  const [expandedPlanId, setExpandedPlanId] = useState(null)

  function togglePlan(planId) {
    setExpandedPlanId(prev => (prev === planId ? null : planId))
  }

  return (
    <>
      <TopNav />
      <main>
      <PageHeader
        title={teamLoading ? '…' : (team?.name ?? 'Team')}
        subtitle="Published sessions"
      />

      {plansLoading && (
        <div style={{ padding: '16px 24px', fontSize: 12, color: 'var(--ink-muted)' }}>
          Loading...
        </div>
      )}

      {!plansLoading && plans.length === 0 && (
        <div className="tpv-empty">No published sessions for this team.</div>
      )}

      {!plansLoading && plans.length > 0 && (
        <div className="tpv-plan-list">
          {plans.map(plan => {
            const isExpanded = expandedPlanId === plan.id
            return (
              <div key={plan.id} className={`tpv-plan-row${isExpanded ? ' expanded' : ''}`}>
                <div className="tpv-plan-summary" onClick={() => togglePlan(plan.id)}>
                  <div className="tpv-plan-week">Wk {plan.weekNumber}</div>
                  <div className="tpv-plan-body">
                    <div className="tpv-plan-title">{plan.title}</div>
                    {plan.durationMinutes && (
                      <div className="tpv-plan-meta">{plan.durationMinutes} min</div>
                    )}
                  </div>
                  <span className="tpv-plan-arrow">{isExpanded ? '↑' : '→'}</span>
                </div>
                {isExpanded && <PlanDrillList planId={plan.id} />}
              </div>
            )
          })}
        </div>
      )}
      </main>
    </>
  )
}

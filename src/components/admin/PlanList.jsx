import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusPill from '../shared/StatusPill'
import supabase from '../../lib/supabase'
import './PlanList.css'

export default function PlanList({ plans, onDeleted }) {
  const navigate = useNavigate()
  const [confirmingPlanId, setConfirmingPlanId] = useState(null)

  const grouped = plans.reduce((acc, plan) => {
    const key = plan.weekNumber
    if (!acc[key]) acc[key] = []
    acc[key].push(plan)
    return acc
  }, {})

  const weeks = Object.keys(grouped).sort((a, b) => b - a)

  async function handleConfirmDelete(planId) {
    await supabase
      .from('plans')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', planId)
    setConfirmingPlanId(null)
    onDeleted?.()
  }

  return (
    <div className="plans-list">
      {weeks.map(week => (
        <div key={week}>
          <div className="week-divider">
            Week {week}{week === weeks[0] ? ' — Current' : ''}
          </div>
          {grouped[week].map(plan => {
            const actionLabel = plan.status === 'published' ? 'Open' : 'Edit'
            return (
              <div
                key={plan.id}
                className="plan-item"
                onClick={() => navigate(`/admin/plans/${plan.id}`)}
              >
                <div className="pi-week">{plan.weekNumber}</div>
                <div className="pi-body">
                  <div className="pi-team">{plan.teamName}</div>
                  <div className="pi-name">{plan.title}</div>
                  <div className="pi-mobile-sub">{plan.teamName} &middot; Wk {plan.weekNumber}</div>
                  <div className="pi-meta">
                    {plan.drillCount} drills &nbsp;&middot;&nbsp; {plan.durationMinutes} min
                    &nbsp;&middot;&nbsp; Created {plan.createdAt}
                  </div>
                </div>
                <div className="pi-right">
                  <StatusPill status={plan.status} />
                  <span className="pi-action">{actionLabel}</span>
                </div>
                <div className="pi-delete-cell" onClick={e => e.stopPropagation()}>
                  {confirmingPlanId === plan.id ? (
                    <span className="pi-confirm">
                      Delete this plan?{' '}
                      <span className="pi-confirm-yes" onClick={() => handleConfirmDelete(plan.id)}>
                        Confirm
                      </span>{' '}
                      <span className="pi-confirm-no" onClick={() => setConfirmingPlanId(null)}>
                        Cancel
                      </span>
                    </span>
                  ) : (
                    <button
                      className="pi-delete-btn"
                      onClick={() => setConfirmingPlanId(plan.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

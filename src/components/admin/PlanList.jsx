import { useNavigate } from 'react-router-dom'
import StatusPill from '../shared/StatusPill'
import './PlanList.css'

export default function PlanList({ plans }) {
  const navigate = useNavigate()

  const grouped = plans.reduce((acc, plan) => {
    const key = plan.weekNumber
    if (!acc[key]) acc[key] = []
    acc[key].push(plan)
    return acc
  }, {})

  const weeks = Object.keys(grouped).sort((a, b) => b - a)

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
                  <div className="pi-meta">
                    {plan.drillCount} drills &nbsp;&middot;&nbsp; {plan.durationMinutes} min
                    &nbsp;&middot;&nbsp; Created {plan.createdAt}
                  </div>
                </div>
                <div className="pi-right">
                  <StatusPill status={plan.status} />
                  <span className="pi-action">{actionLabel}</span>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

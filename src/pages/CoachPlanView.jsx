import { useParams, useNavigate } from 'react-router-dom'
import TopNav from '../components/layout/TopNav'
import { usePlan } from '../hooks/usePlan'
import { useDrills } from '../hooks/useDrills'
import './CoachDashboard.css'

export default function CoachPlanView() {
  const { planId } = useParams()
  const navigate = useNavigate()
  const { plan, team, loading: planLoading, error: planError } = usePlan(planId)
  const { drills, loading: drillsLoading } = useDrills(planId)

  const loading = planLoading || drillsLoading

  if (loading) {
    return (
      <div>
        <TopNav />
        <div style={{ padding: '16px 24px', fontSize: 12, color: 'var(--ink-faint)' }}>Loading...</div>
      </div>
    )
  }

  if (planError || !plan) {
    return (
      <div>
        <TopNav />
        <div style={{ padding: '16px 24px', fontSize: 12, color: 'var(--ink-mid)' }}>
          Could not load session. Check your connection.&nbsp;
          <a href="#" onClick={e => { e.preventDefault(); window.location.reload() }}>Try again</a>
        </div>
      </div>
    )
  }

  return (
    <div>
      <TopNav />

      <div className="session-header">
        <div className="session-date">
          <button
            onClick={() => navigate('/coach')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--tigers-gold)', padding: 0 }}
          >
            &#8592; Back
          </button>
        </div>
        <div className="session-title">Week {plan.weekNumber}: {plan.title}</div>
        <div className="session-team">{team?.name}</div>
      </div>

      <div className="overview-block">
        <div className="overview-label">Session overview</div>
        <table className="overview-table">
          <thead>
            <tr>
              <th className="ov-num">#</th>
              <th>Exercise</th>
              <th className="ov-dur">Duration</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {drills.map(drill => (
              <tr key={drill.id}>
                <td className="ov-num">{drill.order}</td>
                <td>
                  <span
                    className="drill-link"
                    onClick={() => navigate(`/coach/plan/${planId}/drill/${drill.id}`)}
                  >
                    {drill.title}
                  </span>
                </td>
                <td className="ov-dur">{drill.duration}</td>
                <td>{drill.subtitle?.split(',')[0] ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="drills-label">Drill sheets</div>
      <div className="drill-cards">
        {drills.map(drill => (
          <div
            key={drill.id}
            className="drill-card"
            onClick={() => navigate(`/coach/plan/${planId}/drill/${drill.id}`)}
          >
            <div className="dc-num">{drill.order}</div>
            <div className="dc-body">
              <div className="dc-cat">{drill.category}</div>
              <div className="dc-name">{drill.title}</div>
              <div className="dc-meta">
                {drill.duration}
                {drill.format && <>&nbsp;&middot;&nbsp;{drill.format}</>}
                {drill.intensity && drill.intensity !== 'Low' && <>&nbsp;&middot;&nbsp;{drill.intensity} intensity</>}
              </div>
            </div>
            <div className="dc-arrow">&#8594;</div>
          </div>
        ))}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import TopNav from '../components/layout/TopNav'
import { useCoachSession } from '../hooks/useCoachSession'
import supabase from '../lib/supabase'
import './CoachDashboard.css'

export default function CoachDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { team, plan, drills, loading, error } = useCoachSession(user?.id)

  const [allPlans, setAllPlans] = useState([])

  useEffect(() => {
    if (!team?.id) return
    supabase
      .from('plans')
      .select('id, title, week_number, duration_minutes, created_at, status')
      .eq('team_id', team.id)
      .eq('status', 'published')
      .order('week_number', { ascending: false })
      .then(({ data }) => setAllPlans(data ?? []))
  }, [team?.id])

  const today  = new Date(2026, 5, 4)
  const dateStr = today.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div>
        <TopNav />
        <div style={{ padding: '16px 24px', fontSize: 12, color: 'var(--ink-faint)' }}>Loading...</div>
      </div>
    )
  }

  if (error) {
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

  if (!plan) {
    return (
      <div>
        <TopNav />
        <div style={{ padding: '24px', fontSize: 13, color: 'var(--ink-muted)', textAlign: 'center' }}>
          No session assigned for this week. Contact your administrator.
        </div>
      </div>
    )
  }

  return (
    <div>
      <TopNav />

      <div className="session-header">
        <div className="session-date">{dateStr}</div>
        <div className="session-title">Week {plan.weekNumber}: {plan.title}</div>
        <div className="session-team">
          {team?.name}&nbsp;&middot;&nbsp;Coach: {user?.name}
        </div>
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
                    onClick={() => navigate(`/coach/drill/${drill.id}`)}
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
            onClick={() => navigate(`/coach/drill/${drill.id}`)}
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

      <div className="drills-label" style={{ borderTop: '1px solid var(--rule)', marginTop: 8, paddingTop: 16 }}>
        All sessions
      </div>
      <div className="drill-cards">
        {allPlans.length === 0 ? (
          <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--ink-muted)' }}>
            No previous sessions.
          </div>
        ) : allPlans.map(p => (
          <div
            key={p.id}
            className="drill-card"
            onClick={() => navigate(`/coach/plan/${p.id}`)}
          >
            <div className="dc-num" style={{ fontSize: 16 }}>{p.week_number}</div>
            <div className="dc-body">
              <div className="dc-name">{p.title}</div>
              <div className="dc-meta">{p.duration_minutes ? `${p.duration_minutes} min` : ''}</div>
            </div>
            <div className="dc-arrow">&#8594;</div>
          </div>
        ))}
      </div>
    </div>
  )
}

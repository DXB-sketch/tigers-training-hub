import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import TopNav from '../components/layout/TopNav'
import DrillSheet from '../components/drill/DrillSheet'
import { useCoachSession } from '../hooks/useCoachSession'
import { useDrills } from '../hooks/useDrills'
import { usePlan } from '../hooks/usePlan'
import '../styles/print.css'
import './DrillViewer.css'

function CoachDrillViewer({ drillId }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { team, plan, drills, loading, error } = useCoachSession(user?.id)

  const currentDrill = drills.find(d => d.id === drillId) ?? drills[0] ?? null
  const total        = drills.length
  const current      = currentDrill?.order ?? 1

  function handlePrev() {
    const prev = drills.find(d => d.order === current - 1)
    if (prev) navigate(`/coach/drill/${prev.id}`)
  }

  function handleNext() {
    const next = drills.find(d => d.order === current + 1)
    if (next) navigate(`/coach/drill/${next.id}`)
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--page-bg)', minHeight: '100vh', padding: '24px 16px', fontFamily: 'Arial' }}>
        <TopNav />
        <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ background: 'var(--page-bg)', minHeight: '100vh', padding: '24px 16px', fontFamily: 'Arial' }}>
        <TopNav />
        <div style={{ fontSize: 12, color: 'var(--ink-mid)' }}>
          Could not load drill. Check your connection.&nbsp;
          <a href="#" onClick={e => { e.preventDefault(); window.location.reload() }}>Try again</a>
        </div>
      </div>
    )
  }

  const coach = { name: user?.name ?? 'Unknown' }

  return (
    <div style={{ background: 'var(--page-bg)', minHeight: '100vh', padding: '24px 16px', fontFamily: 'Arial' }}>
      <TopNav />
      <div className="drill-back-link">
        <button onClick={() => navigate('/coach')}>&#8592; Back to dashboard</button>
      </div>
      <DrillSheet
        drill={currentDrill}
        plan={plan}
        team={team}
        coach={coach}
        current={current}
        total={total}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  )
}

function AdminDrillViewer({ planId }) {
  const { drills, loading: drillsLoading, error: drillsError } = useDrills(planId)
  const { plan, team, coach, loading: planLoading, error: planError } = usePlan(planId)
  const [currentDrill, setCurrentDrill] = useState(null)

  useEffect(() => {
    if (drills.length > 0 && !currentDrill) {
      setCurrentDrill(drills[0])
    }
  }, [drills])

  const loading = drillsLoading || planLoading
  const error   = drillsError || planError
  const total   = drills.length
  const current = currentDrill?.order ?? 1

  function handlePrev() {
    const prev = drills.find(d => d.order === current - 1)
    if (prev) setCurrentDrill(prev)
  }

  function handleNext() {
    const next = drills.find(d => d.order === current + 1)
    if (next) setCurrentDrill(next)
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--page-bg)', minHeight: '100vh', padding: '24px 16px', fontFamily: 'Arial' }}>
        <TopNav />
        <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ background: 'var(--page-bg)', minHeight: '100vh', padding: '24px 16px', fontFamily: 'Arial' }}>
        <TopNav />
        <div style={{ fontSize: 12, color: 'var(--ink-mid)' }}>
          Could not load plan. Check your connection.&nbsp;
          <a href="#" onClick={e => { e.preventDefault(); window.location.reload() }}>Try again</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--page-bg)', minHeight: '100vh', padding: '24px 16px', fontFamily: 'Arial' }}>
      <TopNav />
      <DrillSheet
        drill={currentDrill}
        plan={plan}
        team={team}
        coach={coach}
        current={current}
        total={total}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  )
}

export default function DrillViewer() {
  const { id } = useParams()
  const location = useLocation()
  const isAdminPreview = location.pathname.includes('/preview')

  if (isAdminPreview) {
    return <AdminDrillViewer planId={id} />
  }
  return <CoachDrillViewer drillId={id} />
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/layout/TopNav'
import PageHeader from '../components/layout/PageHeader'
import PlanList from '../components/admin/PlanList'
import { usePlans } from '../hooks/usePlans'
import { useTeams } from '../hooks/useTeams'
import { useAuth } from '../context/AuthContext'
import supabase from '../lib/supabase'
import './PlanLibrary.css'

export default function PlanLibrary() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [teamFilter, setTeamFilter]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [weekFilter, setWeekFilter]     = useState('')

  const [showNewForm, setShowNewForm] = useState(false)
  const [newTeam, setNewTeam]         = useState('')
  const [newWeek, setNewWeek]         = useState('')
  const [newTitle, setNewTitle]       = useState('')
  const [creating, setCreating]       = useState(false)
  const [createError, setCreateError] = useState('')

  const { teams } = useTeams()
  const { plans, loading, error, refetch } = usePlans({
    teamId: teamFilter || undefined,
    status: statusFilter || undefined,
    weekNumber: weekFilter || undefined,
  })
  const { plans: allPlansForWeeks } = usePlans({})

  const availableWeeks = [...new Set(allPlansForWeeks.map(p => p.weekNumber))].sort((a, b) => b - a)

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    const { data, error: err } = await supabase
      .from('plans')
      .insert({
        team_id: newTeam || null,
        week_number: parseInt(newWeek, 10),
        title: newTitle,
        status: 'draft',
        created_by: user.id,
      })
      .select('id')
      .single()
    setCreating(false)
    if (err || !data) {
      setCreateError('Could not create plan. Try again.')
      return
    }
    navigate(`/admin/plans/${data.id}`)
  }

  function handleCancelNew() {
    setShowNewForm(false)
    setNewTeam('')
    setNewWeek('')
    setNewTitle('')
    setCreateError('')
  }

  return (
    <div>
      <TopNav />
      <PageHeader
        title="Training Plans"
        subtitle="All sessions across every team"
        action={
          <button className="primary-btn" onClick={() => setShowNewForm(v => !v)}>
            + New plan
          </button>
        }
      />

      {showNewForm && (
        <div className="new-plan-form-wrap">
          <form className="new-plan-form" onSubmit={handleCreate}>
            <div className="npf-fields">
              <div className="npf-field">
                <label className="npf-label">Team</label>
                <select
                  className="npf-select"
                  value={newTeam}
                  onChange={e => setNewTeam(e.target.value)}
                  required
                >
                  <option value="">Select team</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="npf-field">
                <label className="npf-label">Week number</label>
                <input
                  className="npf-input"
                  type="number"
                  min="1"
                  max="52"
                  placeholder="e.g. 4"
                  value={newWeek}
                  onChange={e => setNewWeek(e.target.value)}
                  required
                />
              </div>
              <div className="npf-field npf-field--wide">
                <label className="npf-label">Session title</label>
                <input
                  className="npf-input"
                  type="text"
                  placeholder="e.g. Pressing &amp; Transition"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                />
              </div>
            </div>
            {createError && (
              <div className="npf-error">{createError}</div>
            )}
            <div className="npf-actions">
              <button className="primary-btn" type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create plan'}
              </button>
              <button
                className="secondary-btn"
                type="button"
                onClick={handleCancelNew}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="filter-bar">
        <span className="filter-label">Filter</span>
        <select
          className="filter-select"
          value={teamFilter}
          onChange={e => setTeamFilter(e.target.value)}
        >
          <option value="">All teams</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select
          className="filter-select"
          value={weekFilter}
          onChange={e => setWeekFilter(e.target.value)}
        >
          <option value="">All weeks</option>
          {availableWeeks.map(w => (
            <option key={w} value={w}>Week {w}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <div className="filter-divider" />
        <input className="filter-search" type="text" placeholder="Search plans..." />
      </div>

      {loading && (
        <div style={{ padding: '16px 24px', fontSize: 12, color: 'var(--ink-faint)' }}>Loading...</div>
      )}

      {error && (
        <div style={{ padding: '16px 24px', fontSize: 12, color: 'var(--ink-mid)' }}>
          Could not load plans. Check your connection.&nbsp;
          <a href="#" onClick={e => { e.preventDefault(); window.location.reload() }}>Try again</a>
        </div>
      )}

      {!loading && !error && plans.length === 0 && (
        <div style={{ padding: '24px', fontSize: 13, color: 'var(--ink-muted)', textAlign: 'center' }}>
          No plans found for the selected filters.
        </div>
      )}

      {!loading && !error && plans.length > 0 && (
        <PlanList plans={plans} onDeleted={refetch} />
      )}
    </div>
  )
}

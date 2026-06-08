import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import StatusPill from '../shared/StatusPill'
import supabase from '../../lib/supabase'
import './TeamDetailPanel.css'

export default function TeamDetailPanel({ team, currentPlan, loading, allAgeGroups, onSaved, onDeleted }) {
  const [nameEditing, setNameEditing] = useState(false)
  const [nameVal, setNameVal] = useState('')

  // Coach assignment state
  const [assignments, setAssignments] = useState([])
  const [allCoaches, setAllCoaches] = useState([])
  const [coachesLoading, setCoachesLoading] = useState(false)
  const [assignCoachId, setAssignCoachId] = useState('')

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setNameVal(team?.name ?? '')
    setNameEditing(false)
    setConfirmDelete(false)
    setDeleteError(null)
  }, [team?.id])

  useEffect(() => {
    if (!team?.id) {
      setAssignments([])
      setAllCoaches([])
      return
    }
    let cancelled = false
    async function load() {
      setCoachesLoading(true)
      const [{ data: assignData }, { data: coachData }] = await Promise.all([
        supabase
          .from('coach_assignments')
          .select('id, coach_id, is_primary, profiles(id, name, email)')
          .eq('team_id', team.id),
        supabase
          .from('profiles')
          .select('id, name, email')
          .eq('role', 'coach'),
      ])
      if (cancelled) return
      setAssignments(assignData ?? [])
      setAllCoaches(coachData ?? [])
      setAssignCoachId('')
      setCoachesLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [team?.id])

  async function handleNameSave() {
    const trimmed = nameVal.trim()
    setNameEditing(false)
    if (!trimmed || trimmed === team.name) return
    await supabase.from('teams').update({ name: trimmed }).eq('id', team.id)
    onSaved()
  }

  async function handleAgeGroupChange(agId) {
    await supabase.from('teams').update({ age_group_id: agId }).eq('id', team.id)
    onSaved()
  }

  async function handleAssignCoach() {
    if (!assignCoachId) return
    const isFirst = assignments.length === 0
    const { data } = await supabase
      .from('coach_assignments')
      .insert({ team_id: team.id, coach_id: assignCoachId, is_primary: isFirst })
      .select('id, coach_id, is_primary, profiles(id, name, email)')
      .single()
    if (data) setAssignments(prev => [...prev, data])
    setAssignCoachId('')
    onSaved()
  }

  async function handleMakePrimary(assignmentId) {
    await supabase
      .from('coach_assignments')
      .update({ is_primary: false })
      .eq('team_id', team.id)
    await supabase
      .from('coach_assignments')
      .update({ is_primary: true })
      .eq('id', assignmentId)
    setAssignments(prev => prev.map(a => ({ ...a, is_primary: a.id === assignmentId })))
    onSaved()
  }

  async function handleRemoveCoach(assignmentId) {
    const assignment = assignments.find(a => a.id === assignmentId)
    await supabase.from('coach_assignments').delete().eq('id', assignmentId)
    const remaining = assignments.filter(a => a.id !== assignmentId)
    if (assignment?.is_primary && remaining.length > 0) {
      await supabase
        .from('coach_assignments')
        .update({ is_primary: true })
        .eq('id', remaining[0].id)
      remaining[0] = { ...remaining[0], is_primary: true }
    }
    setAssignments(remaining)
    onSaved()
  }

  async function handleDeleteTeam() {
    setDeleting(true)
    setDeleteError(null)
    const { count } = await supabase
      .from('plans')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', team.id)
      .is('deleted_at', null)
      .eq('status', 'published')
    if (count > 0) {
      setDeleteError('This team has published plans. Unpublish or reassign them first.')
      setDeleting(false)
      return
    }
    await supabase.from('coach_assignments').delete().eq('team_id', team.id)
    await supabase.from('teams').delete().eq('id', team.id)
    setDeleting(false)
    onDeleted()
  }

  const unassignedCoaches = allCoaches.filter(
    c => !assignments.some(a => a.coach_id === c.id)
  )

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
          {nameEditing ? (
            <input
              className="dp-team-name-input"
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
              autoFocus
            />
          ) : (
            <div
              className="dp-team-name dp-team-name--editable"
              onClick={() => setNameEditing(true)}
              title="Click to rename"
            >
              {team.name}
            </div>
          )}
        </div>
      </div>

      {/* Age group */}
      <div className="dp-section">
        <div className="dp-section-label">Age group</div>
        <select
          className="dp-select"
          value={team.age_group_id ?? ''}
          onChange={e => handleAgeGroupChange(e.target.value)}
        >
          <option value="">— no group —</option>
          {(allAgeGroups ?? []).map(ag => (
            <option key={ag.id} value={ag.id}>{ag.name}</option>
          ))}
        </select>
      </div>

      {/* Coach assignments */}
      <div className="dp-section">
        <div className="dp-section-label">Coaches</div>
        {coachesLoading ? (
          <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Loading coaches…</div>
        ) : (
          <>
            {assignments.length === 0 && (
              <div className="dp-field">
                <div className="dp-field-val dp-field-val--muted">No coaches assigned</div>
              </div>
            )}
            {assignments.map(a => (
              <div key={a.id} className="dp-coach-row">
                <div className="dp-coach-info">
                  <span className="dp-coach-name">{a.profiles?.name}</span>
                  <span className="dp-coach-email">{a.profiles?.email}</span>
                </div>
                <div className="dp-coach-actions">
                  {a.is_primary ? (
                    <span className="dp-primary-pill">Primary</span>
                  ) : (
                    <button className="dp-make-primary-btn" onClick={() => handleMakePrimary(a.id)}>
                      Make primary
                    </button>
                  )}
                  <button className="dp-remove-btn" onClick={() => handleRemoveCoach(a.id)}>×</button>
                </div>
              </div>
            ))}
            {unassignedCoaches.length > 0 && (
              <div className="dp-assign-coach-row">
                <select
                  className="dp-select dp-select--inline"
                  value={assignCoachId}
                  onChange={e => setAssignCoachId(e.target.value)}
                >
                  <option value="">Assign coach…</option>
                  {unassignedCoaches.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  className="dp-confirm-btn"
                  onClick={handleAssignCoach}
                  disabled={!assignCoachId}
                >
                  Add
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Current plan */}
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

      {/* Team details */}
      <div className="dp-section">
        <div className="dp-section-label">Team details</div>
        <div className="dp-field">
          <div className="dp-field-label">Training day</div>
          <div className="dp-field-val dp-field-val--secondary">
            {team.trainingDay ? `${team.trainingDay}s, ${team.trainingTime}` : '—'}
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

      {/* Delete team */}
      <div className="dp-section dp-section--danger">
        {confirmDelete ? (
          <>
            <div className="dp-delete-confirm-msg">
              Delete {team.name}? All plans assigned to this team will be orphaned.
            </div>
            {deleteError && <div className="dp-error">{deleteError}</div>}
            <div className="dp-delete-actions">
              <button
                className="dp-assign-btn dp-assign-btn--danger"
                onClick={handleDeleteTeam}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                className="dp-assign-btn dp-assign-btn--secondary"
                onClick={() => { setConfirmDelete(false); setDeleteError(null) }}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <button className="dp-delete-team-btn" onClick={() => setConfirmDelete(true)}>
            Delete team
          </button>
        )}
      </div>
    </div>
  )
}

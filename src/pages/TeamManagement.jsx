import { useState, useEffect } from 'react'
import TopNav from '../components/layout/TopNav'
import PageHeader from '../components/layout/PageHeader'
import TeamDetailPanel from '../components/admin/TeamDetailPanel'
import StatusPill from '../components/shared/StatusPill'
import { useTeams } from '../hooks/useTeams'
import { useTeam } from '../hooks/useTeam'
import { useAgeGroups } from '../hooks/useAgeGroups'
import supabase from '../lib/supabase'
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
  const { teams, loading: teamsLoading, error: teamsError, refetch: teamsRefetch } = useTeams()
  const { ageGroups: fetchedAgeGroups, refetch: ageGroupsRefetch } = useAgeGroups()
  const [optimisticAgeGroups, setOptimisticAgeGroups] = useState(null)
  const ageGroups = optimisticAgeGroups ?? fetchedAgeGroups
  const [selectedId, setSelectedId] = useState(null)
  const [createMode, setCreateMode] = useState(false)
  const { team, currentPlan, loading: detailLoading, refetch: teamRefetch } = useTeam(selectedId)

  // Age group management state
  const [editingAgId, setEditingAgId] = useState(null)
  const [confirmDeleteAgId, setConfirmDeleteAgId] = useState(null)
  const [agError, setAgError] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)

  // Grouped teams — collapsed set (default all expanded)
  const [collapsedGroups, setCollapsedGroups] = useState(new Set())

  // Create team form state
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamAgId, setNewTeamAgId] = useState('')
  const [createError, setCreateError] = useState(null)
  const [createSaving, setCreateSaving] = useState(false)

  // Clear optimistic age group order when fresh data arrives from the hook
  useEffect(() => { setOptimisticAgeGroups(null) }, [fetchedAgeGroups])

  function toggleGroup(agId) {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(agId)) next.delete(agId)
      else next.add(agId)
      return next
    })
  }

  // --- Age group mutations ---

  async function handleAgeGroupRename(id, name) {
    setEditingAgId(null)
    const trimmed = name.trim()
    if (!trimmed) return
    await supabase.from('age_groups').update({ name: trimmed }).eq('id', id)
    ageGroupsRefetch()
  }

  async function handleAgeGroupAdd() {
    const maxOrder = ageGroups.reduce((m, ag) => Math.max(m, ag.sort_order ?? 0), 0)
    const { data } = await supabase
      .from('age_groups')
      .insert({ name: 'New age group', sort_order: maxOrder + 1 })
      .select()
      .single()
    if (data) setEditingAgId(data.id)
    ageGroupsRefetch()
  }

  async function handleAgeGroupDeleteConfirm(id) {
    setAgError(null)
    const { count } = await supabase
      .from('teams')
      .select('id', { count: 'exact', head: true })
      .eq('age_group_id', id)
    if (count > 0) {
      setAgError('Age group has teams — reassign them first')
      setConfirmDeleteAgId(null)
      return
    }
    await supabase.from('age_groups').delete().eq('id', id)
    setConfirmDeleteAgId(null)
    ageGroupsRefetch()
  }

  async function handleAgeGroupDrop(dropTargetId) {
    if (!draggingId || draggingId === dropTargetId) return
    const dragged = ageGroups.find(ag => ag.id === draggingId)
    if (!dragged) return
    const others = ageGroups.filter(ag => ag.id !== draggingId)
    const dropIdx = others.findIndex(ag => ag.id === dropTargetId)
    const reordered = [
      ...others.slice(0, dropIdx + 1),
      dragged,
      ...others.slice(dropIdx + 1),
    ].map((ag, i) => ({ ...ag, sort_order: i + 1 }))

    // Reorder visually before the async save
    setOptimisticAgeGroups(reordered)
    setDraggingId(null)
    setDragOverId(null)

    // Save each row individually — upsert violates NOT NULL on name for unmatched rows
    for (const group of reordered) {
      const { error } = await supabase
        .from('age_groups')
        .update({ sort_order: group.sort_order })
        .eq('id', group.id)
      if (error) {
        console.error('Age group reorder failed:', error)
        ageGroupsRefetch()
        return
      }
    }
    ageGroupsRefetch()
  }

  // --- Create team ---

  function handleAddTeamClick() {
    setSelectedId(null)
    setCreateMode(true)
    setNewTeamName('')
    setNewTeamAgId(ageGroups[0]?.id ?? '')
    setCreateError(null)
  }

  async function handleCreateTeam(e) {
    e.preventDefault()
    const name = newTeamName.trim()
    if (!name) { setCreateError('Team name is required'); return }
    if (!newTeamAgId) { setCreateError('Age group is required'); return }
    setCreateSaving(true)
    setCreateError(null)
    const { data, error } = await supabase
      .from('teams')
      .insert({
        name,
        age_group_id: newTeamAgId,
        training_day: null,
        training_time: null,
        player_count: 0,
      })
      .select()
      .single()
    setCreateSaving(false)
    if (error) { setCreateError(error.message); return }
    teamsRefetch()
    setCreateMode(false)
    setNewTeamName('')
    setNewTeamAgId('')
    setSelectedId(data.id)
  }

  function handleTeamSaved() {
    teamsRefetch()
    teamRefetch()
  }

  function handleTeamDeleted() {
    teamsRefetch()
    setSelectedId(null)
  }

  return (
    <div>
      <TopNav />
      <PageHeader
        title="Teams"
        subtitle="Manage coaches, contacts and plan assignments"
        action={
          <button className="primary-btn" onClick={handleAddTeamClick}>
            + Add team
          </button>
        }
      />

      {teamsError && (
        <div style={{ padding: '16px 24px', fontSize: 12, color: 'var(--ink-mid)' }}>
          Could not load teams. Check your connection.&nbsp;
          <a href="#" onClick={e => { e.preventDefault(); teamsRefetch() }}>Try again</a>
        </div>
      )}

      {teamsLoading && (
        <div style={{ padding: '16px 24px', fontSize: 12, color: 'var(--ink-faint)' }}>Loading...</div>
      )}

      {!teamsError && !teamsLoading && (
        <div className={`team-mgmt-layout${(createMode || !!selectedId) ? ' has-selection' : ''}`}>
          <div className="team-list-panel">

            {/* Age Groups section */}
            <div className="ag-section">
              <div className="ag-section-label">Age Groups</div>

              {agError && <div className="ag-error">{agError}</div>}

              {ageGroups.map(ag => (
                <div
                  key={ag.id}
                  className={[
                    'ag-row',
                    draggingId === ag.id ? 'ag-row--dragging' : '',
                    dragOverId === ag.id && draggingId !== ag.id ? 'ag-row--drag-over' : '',
                  ].filter(Boolean).join(' ')}
                  draggable
                  onDragStart={() => { setDraggingId(ag.id); setAgError(null) }}
                  onDragOver={e => { e.preventDefault(); setDragOverId(ag.id) }}
                  onDrop={() => handleAgeGroupDrop(ag.id)}
                  onDragEnd={() => { setDraggingId(null); setDragOverId(null) }}
                >
                  <span className="ag-drag-handle" title="Drag to reorder">⠿</span>

                  {editingAgId === ag.id ? (
                    <input
                      className="ag-name-input"
                      autoFocus
                      defaultValue={ag.name}
                      onBlur={e => handleAgeGroupRename(ag.id, e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
                    />
                  ) : (
                    <span
                      className="ag-name"
                      onClick={() => { setEditingAgId(ag.id); setConfirmDeleteAgId(null) }}
                    >
                      {ag.name}
                    </span>
                  )}

                  {confirmDeleteAgId === ag.id ? (
                    <span className="ag-confirm">
                      Delete {ag.name}?&nbsp;
                      <button className="ag-confirm-yes" onClick={() => handleAgeGroupDeleteConfirm(ag.id)}>Yes</button>
                      <button className="ag-confirm-no" onClick={() => setConfirmDeleteAgId(null)}>Cancel</button>
                    </span>
                  ) : (
                    <button
                      className="ag-delete-btn"
                      onClick={() => { setConfirmDeleteAgId(ag.id); setEditingAgId(null); setAgError(null) }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              <button className="ag-add-btn" onClick={handleAgeGroupAdd}>+ Add age group</button>
            </div>

            <hr className="team-rule" />

            {/* Teams list column headers */}
            <div className="team-list-head">
              <span>Team</span>
              <span>Coach</span>
              <span>Current plan</span>
              <span>Status</span>
              <span></span>
            </div>

            {/* Teams grouped by age group */}
            {ageGroups.map(ag => {
              const groupTeams = teams.filter(t => t.age_group_id === ag.id)
              const isExpanded = !collapsedGroups.has(ag.id)
              return (
                <div key={ag.id} className="team-group">
                  <div className="team-group-header" onClick={() => toggleGroup(ag.id)}>
                    <span className="tgh-name">{ag.name}</span>
                    <span className="tgh-count">{groupTeams.length}</span>
                    <span className="tgh-chevron">{isExpanded ? '▾' : '▸'}</span>
                  </div>
                  {isExpanded && groupTeams.map(t => {
                    const status = getTeamStatus(t)
                    const isSelected = t.id === selectedId
                    const planLabel = t.currentPlanTitle
                      ? `${t.currentPlanTitle} Wk ${t.currentPlanWeek}`
                      : null
                    return (
                      <div
                        key={t.id}
                        className={`team-row${isSelected ? ' selected' : ''}`}
                        onClick={() => { setSelectedId(t.id); setCreateMode(false) }}
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
              )
            })}

            {/* Teams with no matching age group */}
            {(() => {
              const agIds = new Set(ageGroups.map(ag => ag.id))
              const orphans = teams.filter(t => !t.age_group_id || !agIds.has(t.age_group_id))
              if (!orphans.length) return null
              return (
                <div className="team-group">
                  <div className="team-group-header">
                    <span className="tgh-name">Uncategorised</span>
                    <span className="tgh-count">{orphans.length}</span>
                  </div>
                  {orphans.map(t => {
                    const status = getTeamStatus(t)
                    const isSelected = t.id === selectedId
                    return (
                      <div
                        key={t.id}
                        className={`team-row${isSelected ? ' selected' : ''}`}
                        onClick={() => { setSelectedId(t.id); setCreateMode(false) }}
                      >
                        <div className="tr-name">{t.name}</div>
                        <div>
                          {t.coachName
                            ? <span className="tr-coach">{t.coachName}</span>
                            : <span className="tr-no-coach">Unassigned</span>
                          }
                        </div>
                        <div></div>
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
              )
            })()}
          </div>

          {/* Right panel: create form or team detail */}
          <div className="tm-detail-col">
            {(createMode || !!selectedId) && (
              <button
                className="mobile-back-btn"
                onClick={() => { setCreateMode(false); setSelectedId(null) }}
              >
                &#8592; Back
              </button>
            )}
            {createMode ? (
            <div className="detail-panel">
              <div className="dp-header">
                <div className="dp-header-row">
                  <div className="dp-team-name">New Team</div>
                  <button className="dp-edit-btn" onClick={() => setCreateMode(false)}>Cancel</button>
                </div>
              </div>
              <form className="dp-section" onSubmit={handleCreateTeam}>
                <div className="dp-field">
                  <label className="dp-field-label" htmlFor="new-team-name">Team name</label>
                  <input
                    id="new-team-name"
                    className="dp-inline-input"
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    placeholder="e.g. Under 10 Gold"
                    autoFocus
                  />
                </div>
                <div className="dp-field">
                  <label className="dp-field-label" htmlFor="new-team-ag">Age group</label>
                  <select
                    id="new-team-ag"
                    className="dp-select"
                    value={newTeamAgId}
                    onChange={e => setNewTeamAgId(e.target.value)}
                  >
                    <option value="">Select age group…</option>
                    {ageGroups.map(ag => (
                      <option key={ag.id} value={ag.id}>{ag.name}</option>
                    ))}
                  </select>
                </div>
                {createError && <div className="dp-error">{createError}</div>}
                <button type="submit" className="dp-assign-btn" disabled={createSaving}>
                  {createSaving ? 'Creating…' : 'Create team'}
                </button>
              </form>
            </div>
          ) : (
            <TeamDetailPanel
              team={team}
              currentPlan={currentPlan}
              loading={!!selectedId && detailLoading}
              allAgeGroups={ageGroups}
              onSaved={handleTeamSaved}
              onDeleted={handleTeamDeleted}
            />
          )}
          </div>
        </div>
      )}
    </div>
  )
}

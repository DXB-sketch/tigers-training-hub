import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PlanSidebar from '../components/admin/PlanSidebar'
import PitchCanvas from '../components/drill/PitchCanvas'
import StatusPill from '../components/shared/StatusPill'
import { usePlan } from '../hooks/usePlan'
import { useDrills } from '../hooks/useDrills'
import { useTeams } from '../hooks/useTeams'
import supabase from '../lib/supabase'
import './PlanBuilder.css'

function orgToText(org) {
  if (!org || typeof org !== 'object') return ''
  return Object.entries(org).map(([k, v]) => `${k}: ${v}`).join('\n')
}

function textToOrg(text) {
  const result = {}
  for (const line of text.split('\n')) {
    const idx = line.indexOf(':')
    if (idx < 0) continue
    const k = line.slice(0, idx).trim()
    const v = line.slice(idx + 1).trim()
    if (k) result[k] = v
  }
  return result
}

function SaveIndicator({ status }) {
  if (!status) return null
  const color = status === 'saving'
    ? 'var(--ink-faint)'
    : status === 'saved'
    ? 'var(--status-ok-text)'
    : 'var(--status-err-text)'
  return (
    <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color, marginLeft: 12 }}>
      {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : status}
    </span>
  )
}

const DB_FIELD_MAP = {
  title: 'title',
  category: 'category',
  duration: 'duration',
  format: 'format',
  intensity: 'intensity',
  subtitle: 'subtitle',
  description: 'description',
  setup: 'setup',
  progressions: 'progressions',
  coachingPoints: 'coaching_points',
  pitchCrop: 'pitch_crop',
  goalSize: 'goal_size',
}

const VIEW_DIMS = { full: { w: 720, h: 480 }, half: { w: 720, h: 280 }, third: { w: 720, h: 185 }, custom: { w: 720, h: 280 } }

export default function PlanBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { plan: initialPlan, team: initialTeam, loading: planLoading, error: planError } = usePlan(id)
  const { drills: initialDrills, loading: drillsLoading } = useDrills(id)
  const { teams } = useTeams()

  const [plan, setPlan]               = useState(null)
  const [teamId, setTeamId]           = useState('')
  const [drills, setDrills]           = useState([])
  const [selectedDrill, setSelectedDrill] = useState(null)
  const [saveStatus, setSaveStatus]   = useState('')
  const [publishConfirm, setPublishConfirm] = useState(false)

  const [activeTool, setActiveTool]   = useState(null)
  const [activeGoalSize, setActiveGoalSize] = useState('medium')
  const [activeCrop, setActiveCrop]   = useState('third')
  const [arrowStart, setArrowStart]   = useState(null)
  const [previewLine, setPreviewLine] = useState(null)
  const [labelEditor, setLabelEditor] = useState(null)
  const draggingRef = useRef(null)       // ball only — no threshold
  const dragCandidateRef = useRef(null)  // player + cone — 6px threshold

  useEffect(() => {
    if (initialPlan && !plan) {
      setPlan({ ...initialPlan })
      setTeamId(initialPlan.teamId ?? '')
    }
  }, [initialPlan])

  useEffect(() => {
    if (initialDrills.length > 0 && drills.length === 0) {
      setDrills(initialDrills)
      const first = initialDrills[2] ?? initialDrills[0]
      setSelectedDrill({ ...first })
      setActiveCrop(first.pitchCrop ?? 'third')
      setActiveGoalSize(first.goalSize ?? 'medium')
    }
  }, [initialDrills])

  function showSave(result) {
    setSaveStatus(result)
    if (result === 'saved') setTimeout(() => setSaveStatus(''), 2000)
    else if (result !== 'saving') setTimeout(() => setSaveStatus(''), 3000)
  }

  async function savePlanField(field, value) {
    showSave('saving')
    const { error } = await supabase.from('plans').update({ [field]: value }).eq('id', id)
    if (error) { showSave('Save failed'); return false }
    showSave('saved')
    return true
  }

  async function saveDrillField(drillId, field, value) {
    showSave('saving')
    const { error } = await supabase.from('drills').update({ [field]: value }).eq('id', drillId)
    if (error) { showSave('Save failed'); return false }
    showSave('saved')
    return true
  }

  function handlePlanTitleBlur(e) {
    const val = e.target.value
    if (val === plan?.title) return
    const prev = plan?.title
    setPlan(p => ({ ...p, title: val }))
    savePlanField('title', val).then(ok => { if (!ok) setPlan(p => ({ ...p, title: prev })) })
  }

  function handlePlanWeekBlur(e) {
    const val = parseInt(e.target.value, 10)
    if (isNaN(val) || val === plan?.weekNumber) return
    const prev = plan?.weekNumber
    setPlan(p => ({ ...p, weekNumber: val }))
    savePlanField('week_number', val).then(ok => { if (!ok) setPlan(p => ({ ...p, weekNumber: prev })) })
  }

  function handleTeamChange(e) {
    const val = e.target.value
    setTeamId(val)
    savePlanField('team_id', val || null)
  }

  async function confirmPublishToggle() {
    const newStatus = plan?.status === 'published' ? 'draft' : 'published'
    const prev = plan?.status
    setPlan(p => ({ ...p, status: newStatus }))
    setPublishConfirm(false)
    const { error } = await supabase.from('plans').update({ status: newStatus }).eq('id', id)
    if (error) {
      setPlan(p => ({ ...p, status: prev }))
      showSave('Save failed')
    }
  }

  async function handleAddDrill() {
    const maxOrder = drills.reduce((m, d) => Math.max(m, d.order), 0)
    const { data, error } = await supabase
      .from('drills')
      .insert({
        plan_id: id,
        drill_order: maxOrder + 1,
        category: 'Technical',
        title: 'New drill',
        description: '',
        setup: '',
        organisation: '{}',
        progressions: '',
        coaching_points: '',
        players: [],
        arrows: [],
        elements: [],
        pitch_crop: 'third',
        goal_size: 'medium',
      })
      .select('*')
      .single()
    if (error || !data) return
    const newDrill = {
      id: data.id, planId: data.plan_id, order: data.drill_order,
      category: data.category, title: data.title, subtitle: data.subtitle ?? '',
      duration: data.duration ?? '', format: data.format ?? '', intensity: data.intensity ?? '',
      description: [], setup: [], organisation: {}, progressions: [], coachingPoints: [],
      pitchCrop: data.pitch_crop ?? 'third', goalSize: data.goal_size ?? 'medium',
      players: data.players ?? [], arrows: data.arrows ?? [], elements: data.elements ?? [],
    }
    setDrills(prev => [...prev, newDrill])
    setSelectedDrill(newDrill)
    setActiveCrop('third')
    setActiveGoalSize('medium')
  }

  function handleSelectDrill(drill) {
    setSelectedDrill({ ...drill })
    setLabelEditor(null)
    setArrowStart(null)
    setPreviewLine(null)
    setActiveCrop(drill.pitchCrop ?? 'third')
    setActiveGoalSize(drill.goalSize ?? 'medium')
  }

  async function handleDeleteDrill(drill) {
    const remaining = drills.filter(d => d.id !== drill.id)
    const reordered = remaining.map((d, i) => ({ ...d, order: i + 1 }))
    setDrills(reordered)
    if (selectedDrill?.id === drill.id) {
      const idx = drills.findIndex(d => d.id === drill.id)
      const next = reordered[idx] ?? reordered[idx - 1] ?? null
      setSelectedDrill(next ? { ...next } : null)
    }
    await supabase.from('drills').delete().eq('id', drill.id)
    if (reordered.length > 0) {
      await supabase.from('drills').upsert(reordered.map(d => ({ id: d.id, drill_order: d.order })))
    }
  }

  async function handleReorderDrills(fromIndex, toIndex) {
    if (fromIndex === toIndex) return
    const reordered = [...drills]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    const updated = reordered.map((d, i) => ({ ...d, order: i + 1 }))
    setDrills(updated)
    if (selectedDrill) {
      const refreshed = updated.find(d => d.id === selectedDrill.id)
      if (refreshed) setSelectedDrill({ ...refreshed })
    }
    await supabase.from('drills').upsert(updated.map(d => ({ id: d.id, drill_order: d.order })))
  }

  function handleDrillFieldChange(field, value) {
    setSelectedDrill(prev => ({ ...prev, [field]: value }))
    setDrills(prev => prev.map(d => d.id === selectedDrill?.id ? { ...d, [field]: value } : d))
  }

  function handleDrillTextBlur(field, rawValue) {
    const dbField = DB_FIELD_MAP[field] ?? field
    const value = Array.isArray(rawValue) ? rawValue.join('\n') : rawValue
    saveDrillField(selectedDrill.id, dbField, value)
  }

  function handleOrgBlur(text) {
    try {
      const obj = textToOrg(text)
      const jsonStr = JSON.stringify(obj)
      handleDrillFieldChange('organisation', obj)
      saveDrillField(selectedDrill.id, 'organisation', jsonStr)
    } catch {
      showSave('Save failed — check format')
    }
  }

  function svgCoords(e, svgEl) {
    const rect = svgEl.getBoundingClientRect()
    const dims = VIEW_DIMS[activeCrop] ?? VIEW_DIMS.third
    return {
      cx: (e.clientX - rect.left) * (dims.w / rect.width),
      cy: (e.clientY - rect.top) * (dims.h / rect.height),
    }
  }

  function savePitchState(players, arrows, elements) {
    if (!selectedDrill) return
    showSave('saving')
    supabase.from('drills').update({
      players,
      arrows,
      elements,
    }).eq('id', selectedDrill.id).then(({ error }) => {
      error ? showSave('Save failed') : showSave('saved')
    })
  }

  function handleSvgClick(e) {
    if (!selectedDrill) return
    const { cx, cy } = svgCoords(e, e.currentTarget)

    if (activeTool === 'red-player' || activeTool === 'blue-player') {
      const team = activeTool === 'red-player' ? 'red' : 'blue'
      const newPlayer = { id: crypto.randomUUID(), team, cx, cy, label: 'CM', name: '' }
      const updated = [...(selectedDrill.players ?? []), newPlayer]
      handleDrillFieldChange('players', updated)
      savePitchState(updated, selectedDrill.arrows, selectedDrill.elements)
      return
    }
    if (activeTool === 'ball' || activeTool === 'cone') {
      const newEl = { id: crypto.randomUUID(), type: activeTool, cx, cy }
      const updated = [...(selectedDrill.elements ?? []), newEl]
      handleDrillFieldChange('elements', updated)
      savePitchState(selectedDrill.players, selectedDrill.arrows, updated)
      return
    }
    if (activeTool === 'move-arrow' || activeTool === 'pass-arrow') {
      if (!arrowStart) {
        setArrowStart({ cx, cy })
      } else {
        const type = activeTool === 'move-arrow' ? 'move' : 'pass'
        const newArrow = { id: crypto.randomUUID(), type, d: `M${arrowStart.cx} ${arrowStart.cy} L${cx} ${cy}` }
        const updated = [...(selectedDrill.arrows ?? []), newArrow]
        handleDrillFieldChange('arrows', updated)
        savePitchState(selectedDrill.players, updated, selectedDrill.elements)
        setArrowStart(null)
        setPreviewLine(null)
      }
    }
  }

  function handleSvgMouseMove(e) {
    const svgEl = e.currentTarget

    // Issue 4: dragCandidateRef handles players and cones with 6px threshold
    if (dragCandidateRef.current) {
      const dc = dragCandidateRef.current
      const dx = e.clientX - dc.startX
      const dy = e.clientY - dc.startY
      if (!dc.isDragging && Math.sqrt(dx * dx + dy * dy) > 6) {
        dc.isDragging = true
      }
      if (dc.isDragging) {
        const { cx, cy } = svgCoords(e, svgEl)
        if (dc.type === 'player') {
          setSelectedDrill(prev => ({ ...prev, players: prev.players.map(p => p.id === dc.id ? { ...p, cx, cy } : p) }))
          setDrills(prev => prev.map(d => d.id === selectedDrill?.id
            ? { ...d, players: d.players.map(p => p.id === dc.id ? { ...p, cx, cy } : p) }
            : d))
        } else if (dc.type === 'cone') {
          setSelectedDrill(prev => ({ ...prev, elements: prev.elements.map(el => el.id === dc.id ? { ...el, cx, cy } : el) }))
          setDrills(prev => prev.map(d => d.id === selectedDrill?.id
            ? { ...d, elements: d.elements.map(el => el.id === dc.id ? { ...el, cx, cy } : el) }
            : d))
        }
      }
      return
    }

    // draggingRef handles ball (no threshold)
    if (draggingRef.current) {
      const { cx, cy } = svgCoords(e, svgEl)
      const { id: dragId } = draggingRef.current
      setSelectedDrill(prev => ({ ...prev, elements: prev.elements.map(el => el.id === dragId ? { ...el, cx, cy } : el) }))
      setDrills(prev => prev.map(d => d.id === selectedDrill?.id
        ? { ...d, elements: d.elements.map(el => el.id === dragId ? { ...el, cx, cy } : el) }
        : d))
      return
    }

    if (arrowStart && (activeTool === 'move-arrow' || activeTool === 'pass-arrow')) {
      const { cx, cy } = svgCoords(e, svgEl)
      setPreviewLine({ x1: arrowStart.cx, y1: arrowStart.cy, x2: cx, y2: cy })
    }
  }

  function handleSvgMouseUp(e) {
    // Issue 4: dragCandidateRef — resolve as click or drag
    if (dragCandidateRef.current) {
      const dc = dragCandidateRef.current
      dragCandidateRef.current = null
      if (!selectedDrill) return
      if (dc.isDragging) {
        // Drag ended — save final position to Supabase
        if (dc.type === 'player') {
          savePitchState(selectedDrill.players, selectedDrill.arrows, selectedDrill.elements)
        } else if (dc.type === 'cone') {
          savePitchState(selectedDrill.players, selectedDrill.arrows, selectedDrill.elements)
        }
      } else {
        // Was a click — open label editor for players when no tool active
        if (activeTool === null && dc.type === 'player') {
          const p = selectedDrill.players.find(pl => pl.id === dc.id)
          if (p) setLabelEditor({ id: p.id, cx: p.cx, cy: p.cy, label: p.label, name: p.name })
        }
      }
      return
    }

    // draggingRef — ball drag ended
    if (draggingRef.current) {
      const { cx, cy } = svgCoords(e, e.currentTarget)
      const { id: dragId } = draggingRef.current
      draggingRef.current = null
      if (!selectedDrill) return
      const updated = selectedDrill.elements.map(el => el.id === dragId ? { ...el, cx, cy } : el)
      setSelectedDrill(prev => ({ ...prev, elements: updated }))
      savePitchState(selectedDrill.players, selectedDrill.arrows, updated)
    }
  }

  // Issue 4: e.preventDefault() (not stopPropagation) so SVG handleMouseDown also fires for label editor close check
  function handlePlayerMouseDown(e, player) {
    e.preventDefault()
    dragCandidateRef.current = { id: player.id, type: 'player', startX: e.clientX, startY: e.clientY, isDragging: false }
  }

  function handleElementMouseDown(e, el) {
    e.preventDefault()
    if (el.type === 'cone') {
      // Issue 4: cone uses dragCandidateRef with threshold
      dragCandidateRef.current = { id: el.id, type: 'cone', startX: e.clientX, startY: e.clientY, isDragging: false }
    } else {
      // ball: immediate drag, no threshold
      draggingRef.current = { id: el.id, type: 'element' }
    }
  }

  function handleContextMenu(e, itemId, arrayField) {
    e.preventDefault()
    if (!selectedDrill) return
    const updated = (selectedDrill[arrayField] ?? []).filter(item => item.id !== itemId)
    handleDrillFieldChange(arrayField, updated)
    const pl = arrayField === 'players' ? updated : selectedDrill.players
    const ar = arrayField === 'arrows' ? updated : selectedDrill.arrows
    const el = arrayField === 'elements' ? updated : selectedDrill.elements
    savePitchState(pl, ar, el)
  }

  function saveLabelEdit() {
    if (!labelEditor || !selectedDrill) return
    const updated = selectedDrill.players.map(p =>
      p.id === labelEditor.id ? { ...p, label: labelEditor.label, name: labelEditor.name } : p
    )
    handleDrillFieldChange('players', updated)
    savePitchState(updated, selectedDrill.arrows, selectedDrill.elements)
    setLabelEditor(null)
  }

  function handleCropChange(crop) {
    setActiveCrop(crop)
    handleDrillFieldChange('pitchCrop', crop)
    saveDrillField(selectedDrill.id, 'pitch_crop', crop)
  }

  function handleGoalSizeChange(size) {
    setActiveGoalSize(size)
    handleDrillFieldChange('goalSize', size)
    saveDrillField(selectedDrill.id, 'goal_size', size)
  }

  if (planLoading) {
    return <div style={{ padding: '40px', fontFamily: 'Arial', color: 'var(--ink-faint)', fontSize: 12 }}>Loading...</div>
  }
  if (planError || !initialPlan) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Arial', color: 'var(--ink-mid)', fontSize: 12 }}>
        Could not load plan.&nbsp;
        <a href="#" onClick={e => { e.preventDefault(); window.location.reload() }}>Try again</a>
      </div>
    )
  }

  const currentTeam = teams.find(t => t.id === teamId)
  const displayTeamName = currentTeam?.name ?? initialTeam?.name ?? ''

  return (
    <div style={{ fontFamily: 'Arial' }}>
      <div className="builder-top-bar">
        <button className="tb-back" onClick={() => navigate('/admin/plans')}>&#8592; Plans</button>
        <div className="tb-breadcrumb">
          {displayTeamName}&nbsp;/&nbsp;
          <strong>{plan?.title} — Week {plan?.weekNumber}</strong>
        </div>
        <div className="tb-actions">
          <button className="tb-btn" onClick={() => navigate(`/admin/plans/${id}/preview`)}>Preview</button>
        </div>
      </div>

      <div className="plan-meta-header">
        <div className="pmh-field pmh-field--title">
          <div className="pmh-label">Session title</div>
          <input
            className="pmh-input pmh-input--title"
            defaultValue={plan?.title}
            key={`pt-${plan?.id}`}
            onBlur={handlePlanTitleBlur}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
          />
        </div>
        <div className="pmh-field">
          <div className="pmh-label">Team</div>
          <select className="pmh-select" value={teamId} onChange={handleTeamChange}>
            <option value="">No team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="pmh-field">
          <div className="pmh-label">Week</div>
          <input
            className="pmh-input"
            type="number"
            min="1"
            max="52"
            defaultValue={plan?.weekNumber}
            key={`pw-${plan?.id}`}
            onBlur={handlePlanWeekBlur}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
          />
        </div>
        <div className="pmh-field pmh-field--status">
          <div className="pmh-label">Status</div>
          {publishConfirm ? (
            <div className="pmh-publish-confirm">
              <span className="pmh-confirm-text">
                {plan?.status === 'published'
                  ? 'Revert to draft? Coaches will no longer see this plan.'
                  : 'Publish this plan? Coaches will be able to see it.'}
              </span>
              <button className="pmh-confirm-btn pmh-confirm-btn--yes" onClick={confirmPublishToggle}>
                {plan?.status === 'published' ? 'Revert' : 'Publish'}
              </button>
              <button className="pmh-confirm-btn" onClick={() => setPublishConfirm(false)}>Cancel</button>
            </div>
          ) : (
            <button className="pmh-status-btn" onClick={() => setPublishConfirm(true)}>
              <StatusPill status={plan?.status ?? 'draft'} />
            </button>
          )}
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      <div className="builder-layout">
        <PlanSidebar
          plan={plan}
          teamName={displayTeamName}
          drills={drills}
          activeDrillId={selectedDrill?.id}
          onSelectDrill={handleSelectDrill}
          onAddDrill={handleAddDrill}
          onDeleteDrill={handleDeleteDrill}
          onReorderDrills={handleReorderDrills}
        />

        <div className="drill-editor">
          {drillsLoading && (
            <div style={{ padding: '40px 24px', color: 'var(--ink-faint)', fontSize: 12 }}>Loading...</div>
          )}
          {!drillsLoading && selectedDrill ? (
            <>
              <div className="de-header">
                <div style={{ flex: 1 }}>
                  <div className="de-drill-num">
                    Drill {selectedDrill.order} of {drills.length}
                    <SaveIndicator status={saveStatus} />
                  </div>
                  <input
                    className="de-title-input"
                    value={selectedDrill.title ?? ''}
                    onChange={e => handleDrillFieldChange('title', e.target.value)}
                    onBlur={e => handleDrillTextBlur('title', e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
                  />
                </div>
              </div>

              <div className="de-meta-row">
                {[
                  { field: 'category', label: 'Category', width: 120 },
                  { field: 'duration', label: 'Duration' },
                  { field: 'format', label: 'Format' },
                  { field: 'intensity', label: 'Intensity' },
                ].map(({ field, label, width }) => (
                  <div key={field} className="de-meta-field">
                    <div className="de-meta-label">{label}</div>
                    <input
                      className="de-meta-input"
                      style={width ? { width } : undefined}
                      value={selectedDrill[field] ?? ''}
                      onChange={e => handleDrillFieldChange(field, e.target.value)}
                      onBlur={e => handleDrillTextBlur(field, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="pitch-area">
                <div className="pitch-toolbar">
                  <span className="pt-label">Players:</span>
                  {['red-player', 'blue-player'].map(tool => (
                    <button
                      key={tool}
                      className={`pt-btn${activeTool === tool ? ' active' : ''}`}
                      onClick={() => setActiveTool(prev => prev === tool ? null : tool)}
                    >
                      {tool === 'red-player' ? '● Red' : '● Blue'}
                    </button>
                  ))}
                  <div className="pt-divider" />
                  <span className="pt-label">Elements:</span>
                  {[
                    ['ball', 'Ball'],
                    ['cone', 'Cone'],
                    ['move-arrow', 'Run →'],
                    ['pass-arrow', 'Pass …'],
                  ].map(([tool, label]) => (
                    <button
                      key={tool}
                      className={`pt-btn${activeTool === tool ? ' active' : ''}`}
                      onClick={() => setActiveTool(prev => prev === tool ? null : tool)}
                    >
                      {label}
                    </button>
                  ))}
                  <div className="pt-divider" />
                  <span className="pt-label">Goal:</span>
                  {['mini', 'small', 'medium', 'full'].map(size => (
                    <button
                      key={size}
                      className={`pt-btn${activeGoalSize === size ? ' active' : ''}`}
                      onClick={() => handleGoalSizeChange(size)}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </button>
                  ))}
                  <div className="pt-divider" />
                  <span className="pt-label">Pitch crop:</span>
                  {['third', 'half', 'full'].map(crop => (
                    <button
                      key={crop}
                      className={`pt-btn${activeCrop === crop ? ' active' : ''}`}
                      onClick={() => handleCropChange(crop)}
                    >
                      {crop.charAt(0).toUpperCase() + crop.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="pitch-editor-wrap" style={{ cursor: activeTool ? 'crosshair' : 'default' }}>
                  <PitchCanvas
                    interactive
                    crop={activeCrop}
                    players={selectedDrill.players ?? []}
                    arrows={selectedDrill.arrows ?? []}
                    elements={selectedDrill.elements ?? []}
                    goalSize={activeGoalSize}
                    activeTool={activeTool}
                    arrowStart={arrowStart}
                    previewLine={previewLine}
                    labelEditor={labelEditor}
                    onSvgClick={handleSvgClick}
                    onSvgMouseMove={handleSvgMouseMove}
                    onSvgMouseUp={handleSvgMouseUp}
                    onPlayerMouseDown={handlePlayerMouseDown}
                    onElementMouseDown={handleElementMouseDown}
                    onContextMenu={handleContextMenu}
                    onLabelChange={setLabelEditor}
                    onLabelSave={saveLabelEdit}
                    onLabelClose={() => setLabelEditor(null)}
                  />
                </div>
              </div>

              <div className="drill-fields">
                <div className="drill-field-col">
                  <div className="field-section">
                    <span className="fs-label">Description</span>
                    <textarea
                      className="fs-textarea"
                      rows={4}
                      placeholder="Describe what happens in this drill..."
                      value={Array.isArray(selectedDrill.description) ? selectedDrill.description.join('\n') : (selectedDrill.description ?? '')}
                      onChange={e => handleDrillFieldChange('description', e.target.value.split('\n'))}
                      onBlur={e => handleDrillTextBlur('description', e.target.value)}
                    />
                  </div>
                  <div className="field-section">
                    <span className="fs-label">Setup</span>
                    <textarea
                      className="fs-textarea"
                      rows={3}
                      placeholder="How do coaches and players set this up?"
                      value={Array.isArray(selectedDrill.setup) ? selectedDrill.setup.join('\n') : (selectedDrill.setup ?? '')}
                      onChange={e => handleDrillFieldChange('setup', e.target.value.split('\n'))}
                      onBlur={e => handleDrillTextBlur('setup', e.target.value)}
                    />
                  </div>
                </div>
                <div className="drill-field-col">
                  <div className="field-section">
                    <span className="fs-label">Organisation</span>
                    <textarea
                      className="fs-textarea"
                      rows={3}
                      placeholder={'area: 30 x 40 m\ngoals: 2 x medium\nballs: 6 spare'}
                      defaultValue={orgToText(selectedDrill.organisation)}
                      key={`org-${selectedDrill.id}`}
                      onBlur={e => handleOrgBlur(e.target.value)}
                    />
                  </div>
                  <div className="field-section">
                    <span className="fs-label">Progressions</span>
                    <textarea
                      className="fs-textarea"
                      rows={3}
                      placeholder="How does the drill progress or regress?"
                      value={Array.isArray(selectedDrill.progressions) ? selectedDrill.progressions.join('\n') : (selectedDrill.progressions ?? '')}
                      onChange={e => handleDrillFieldChange('progressions', e.target.value.split('\n'))}
                      onBlur={e => handleDrillTextBlur('progressions', e.target.value)}
                    />
                  </div>
                  <div className="field-section">
                    <span className="fs-label">Coaching points</span>
                    <textarea
                      className="fs-textarea"
                      rows={3}
                      placeholder="What should the coach watch for and say?"
                      value={Array.isArray(selectedDrill.coachingPoints) ? selectedDrill.coachingPoints.join('\n') : (selectedDrill.coachingPoints ?? '')}
                      onChange={e => handleDrillFieldChange('coachingPoints', e.target.value.split('\n'))}
                      onBlur={e => handleDrillTextBlur('coachingPoints', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : !drillsLoading && (
            <div style={{ padding: '40px 24px', color: 'var(--ink-faint)', fontSize: 12 }}>
              Select a drill from the sidebar to edit it.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

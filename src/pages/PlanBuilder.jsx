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

const VIEW_DIMS = { full: { w: 720, h: 480 }, half: { w: 720, h: 280 }, third: { w: 720, h: 185 }, custom: { w: 720, h: 480 }, blank: { w: 720, h: 185 } }

function parseCropType(crop) {
  try {
    const obj = JSON.parse(crop)
    if (obj && obj.type === 'custom') return 'custom'
  } catch {}
  return crop
}

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
  const [zoneDrawing, setZoneDrawing] = useState(null)
  const [activeZoneColor, setActiveZoneColor] = useState('gold')
  const [isMobile, setIsMobile]       = useState(() => window.innerWidth <= 700)
  const [fabOpen, setFabOpen]         = useState(false)
  const [selectedElement, setSelectedElement] = useState(null)
  const [cropEditingActive, setCropEditingActive] = useState(false)
  const draggingRef = useRef(null)       // ball only — no threshold
  const dragCandidateRef = useRef(null)  // player + cone — 6px threshold
  const mobileSvgElRef = useRef(null)
  const mobileDragRef = useRef(null)

  // Second canvas state
  const [activeCrop2, setActiveCrop2]         = useState('full')
  const [arrowStart2, setArrowStart2]         = useState(null)
  const [previewLine2, setPreviewLine2]       = useState(null)
  const [labelEditor2, setLabelEditor2]       = useState(null)
  const [zoneDrawing2, setZoneDrawing2]       = useState(null)
  const [selectedElement2, setSelectedElement2] = useState(null)
  const [cropEditingActive2, setCropEditingActive2] = useState(false)
  const draggingRef2 = useRef(null)
  const dragCandidateRef2 = useRef(null)

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
      setActiveCrop2(first.secondCanvas?.pitchCrop ?? 'full')
    }
  }, [initialDrills])

  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth <= 700) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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
    setActiveCrop2(drill.secondCanvas?.pitchCrop ?? 'full')
    setArrowStart2(null)
    setPreviewLine2(null)
    setLabelEditor2(null)
    setZoneDrawing2(null)
    setSelectedElement2(null)
    setCropEditingActive2(false)
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
    const cropKey = parseCropType(activeCrop)
    const dims = VIEW_DIMS[cropKey] ?? VIEW_DIMS.third
    return {
      cx: (e.clientX - rect.left) * (dims.w / rect.width),
      cy: (e.clientY - rect.top) * (dims.h / rect.height),
    }
  }

  function svgCoords2(e, svgEl) {
    const rect = svgEl.getBoundingClientRect()
    const cropKey = parseCropType(activeCrop2)
    const dims = VIEW_DIMS[cropKey] ?? VIEW_DIMS.full
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

  function savePitchState2(players, arrows, elements) {
    if (!selectedDrill?.secondCanvas) return
    const dbSc = {
      players,
      arrows,
      elements,
      pitch_crop: selectedDrill.secondCanvas.pitchCrop ?? 'full',
    }
    showSave('saving')
    supabase.from('drills').update({ second_canvas: dbSc }).eq('id', selectedDrill.id).then(({ error }) => {
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

  function handleSvgMouseDown(e) {
    if (e.button !== 0) return
    if (activeTool !== 'zone-circle' && activeTool !== 'zone-rect') return
    if (!selectedDrill) return
    if (dragCandidateRef.current || draggingRef.current) return
    const { cx, cy } = svgCoords(e, e.currentTarget)
    setZoneDrawing({ active: true, startX: cx, startY: cy, currentX: cx, currentY: cy, type: activeTool })
  }

  function handleSvgMouseMove(e) {
    const svgEl = e.currentTarget

    // Zone drawing preview
    if (zoneDrawing?.active) {
      const { cx, cy } = svgCoords(e, svgEl)
      setZoneDrawing(prev => prev ? { ...prev, currentX: cx, currentY: cy } : null)
      return
    }

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
    // Zone drawing completion
    if (zoneDrawing?.active) {
      const { cx: endX, cy: endY } = svgCoords(e, e.currentTarget)
      const dx = endX - zoneDrawing.startX
      const dy = endY - zoneDrawing.startY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist >= 10 && selectedDrill) {
        let newZone
        if (zoneDrawing.type === 'zone-circle') {
          newZone = {
            id: crypto.randomUUID(), type: 'zone-circle',
            cx: (zoneDrawing.startX + endX) / 2,
            cy: (zoneDrawing.startY + endY) / 2,
            r: dist / 2,
            color: activeZoneColor,
          }
        } else {
          newZone = {
            id: crypto.randomUUID(), type: 'zone-rect',
            x: Math.min(zoneDrawing.startX, endX),
            y: Math.min(zoneDrawing.startY, endY),
            width: Math.abs(dx),
            height: Math.abs(dy),
            color: activeZoneColor,
          }
        }
        const updated = [...(selectedDrill.elements ?? []), newZone]
        handleDrillFieldChange('elements', updated)
        savePitchState(selectedDrill.players, selectedDrill.arrows, updated)
      }
      setZoneDrawing(null)
      return
    }

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
    if (e.button !== 0) return
    e.preventDefault()
    dragCandidateRef.current = { id: player.id, type: 'player', startX: e.clientX, startY: e.clientY, isDragging: false }
  }

  function handleElementMouseDown(e, el) {
    if (e.button !== 0) return
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

  function svgCoordsFromTouch(touch) {
    if (!mobileSvgElRef.current) return { cx: 0, cy: 0 }
    const rect = mobileSvgElRef.current.getBoundingClientRect()
    const cropKey = parseCropType(activeCrop)
    const dims = VIEW_DIMS[cropKey] ?? VIEW_DIMS.third
    return {
      cx: (touch.clientX - rect.left) * (dims.w / rect.width),
      cy: (touch.clientY - rect.top) * (dims.h / rect.height),
    }
  }

  function handleMobileElementTap(id, arrayField, elementType) {
    if (selectedElement?.id === id) {
      setSelectedElement(null)
    } else {
      setSelectedElement({ id, arrayField, elementType })
    }
  }

  function handleMobileSvgTap() {
    setSelectedElement(null)
  }

  function handleMobileDelete() {
    if (!selectedElement || !selectedDrill) return
    const { id, arrayField } = selectedElement
    const updated = (selectedDrill[arrayField] ?? []).filter(item => item.id !== id)
    handleDrillFieldChange(arrayField, updated)
    const pl = arrayField === 'players' ? updated : selectedDrill.players
    const ar = arrayField === 'arrows' ? updated : selectedDrill.arrows
    const el = arrayField === 'elements' ? updated : selectedDrill.elements
    savePitchState(pl, ar, el)
    setSelectedElement(null)
  }

  function handleMobileEditLabel() {
    if (!selectedElement || !selectedDrill) return
    const p = selectedDrill.players.find(pl => pl.id === selectedElement.id)
    if (!p) return
    setLabelEditor({ id: p.id, cx: p.cx, cy: p.cy, label: p.label, name: p.name })
    setSelectedElement(null)
  }

  function handleMoveTouchStart(e) {
    e.preventDefault()
    if (!selectedElement || !selectedDrill) return
    const touch = e.touches[0]
    if (!touch) return
    const { id, arrayField } = selectedElement
    const svgStart = svgCoordsFromTouch(touch)
    let startElementX, startElementY, startX1, startY1, startX2, startY2
    const isArrow = arrayField === 'arrows'
    let isRect = false

    if (arrayField === 'players') {
      const p = selectedDrill.players.find(pl => pl.id === id)
      if (!p) return
      startElementX = p.cx; startElementY = p.cy
    } else if (arrayField === 'elements') {
      const el = selectedDrill.elements.find(el => el.id === id)
      if (!el) return
      if (el.type === 'zone-rect') {
        startElementX = el.x; startElementY = el.y; isRect = true
      } else {
        startElementX = el.cx; startElementY = el.cy
      }
    } else if (isArrow) {
      const arrow = selectedDrill.arrows.find(a => a.id === id)
      if (!arrow) return
      const match = arrow.d.match(/M([\d.-]+)\s+([\d.-]+)\s+L([\d.-]+)\s+([\d.-]+)/)
      if (!match) return
      startX1 = parseFloat(match[1]); startY1 = parseFloat(match[2])
      startX2 = parseFloat(match[3]); startY2 = parseFloat(match[4])
    }

    mobileDragRef.current = {
      startSvgX: svgStart.cx, startSvgY: svgStart.cy,
      startElementX, startElementY,
      startX1, startY1, startX2, startY2,
      isArrow, isRect,
    }
  }

  function handleMoveTouchMove(e) {
    e.preventDefault()
    const md = mobileDragRef.current
    if (!md || !selectedElement || !selectedDrill) return
    const touch = e.touches[0]
    if (!touch) return
    const { cx: currentX, cy: currentY } = svgCoordsFromTouch(touch)
    const dx = currentX - md.startSvgX
    const dy = currentY - md.startSvgY
    const { id, arrayField } = selectedElement

    if (arrayField === 'players') {
      const newX = md.startElementX + dx, newY = md.startElementY + dy
      setSelectedDrill(prev => ({ ...prev, players: prev.players.map(p => p.id === id ? { ...p, cx: newX, cy: newY } : p) }))
      setDrills(prev => prev.map(d => d.id === selectedDrill.id
        ? { ...d, players: d.players.map(p => p.id === id ? { ...p, cx: newX, cy: newY } : p) }
        : d))
    } else if (arrayField === 'elements') {
      if (md.isRect) {
        const newX = md.startElementX + dx, newY = md.startElementY + dy
        setSelectedDrill(prev => ({ ...prev, elements: prev.elements.map(el => el.id === id ? { ...el, x: newX, y: newY } : el) }))
        setDrills(prev => prev.map(d => d.id === selectedDrill.id
          ? { ...d, elements: d.elements.map(el => el.id === id ? { ...el, x: newX, y: newY } : el) }
          : d))
      } else {
        const newX = md.startElementX + dx, newY = md.startElementY + dy
        setSelectedDrill(prev => ({ ...prev, elements: prev.elements.map(el => el.id === id ? { ...el, cx: newX, cy: newY } : el) }))
        setDrills(prev => prev.map(d => d.id === selectedDrill.id
          ? { ...d, elements: d.elements.map(el => el.id === id ? { ...el, cx: newX, cy: newY } : el) }
          : d))
      }
    } else if (arrayField === 'arrows') {
      const newD = `M${md.startX1 + dx} ${md.startY1 + dy} L${md.startX2 + dx} ${md.startY2 + dy}`
      setSelectedDrill(prev => ({ ...prev, arrows: prev.arrows.map(a => a.id === id ? { ...a, d: newD } : a) }))
      setDrills(prev => prev.map(d => d.id === selectedDrill.id
        ? { ...d, arrows: d.arrows.map(a => a.id === id ? { ...a, d: newD } : a) }
        : d))
    }
  }

  function handleMoveTouchEnd() {
    if (!mobileDragRef.current || !selectedDrill) return
    mobileDragRef.current = null
    savePitchState(selectedDrill.players, selectedDrill.arrows, selectedDrill.elements)
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
    if (crop === 'custom') {
      const jsonStr = JSON.stringify({ type: 'custom', top: 0, left: 0, right: VIEW_DIMS.full.w, bottom: VIEW_DIMS.full.h })
      setActiveCrop(jsonStr)
      handleDrillFieldChange('pitchCrop', jsonStr)
      saveDrillField(selectedDrill.id, 'pitch_crop', jsonStr)
      setCropEditingActive(true)
    } else {
      setActiveCrop(crop)
      handleDrillFieldChange('pitchCrop', crop)
      saveDrillField(selectedDrill.id, 'pitch_crop', crop)
      setCropEditingActive(false)
    }
  }

  function handleCustomCropSave(jsonStr) {
    setActiveCrop(jsonStr)
    setSelectedDrill(prev => ({ ...prev, pitchCrop: jsonStr }))
    setDrills(prev => prev.map(d => d.id === selectedDrill?.id ? { ...d, pitchCrop: jsonStr } : d))
    setCropEditingActive(false)
    showSave('saving')
    supabase.from('drills').update({ pitch_crop: jsonStr }).eq('id', selectedDrill.id).then(({ error }) => {
      error ? showSave('Save failed') : showSave('saved')
    })
  }

  function handleGoalSizeChange(size) {
    setActiveGoalSize(size)
    handleDrillFieldChange('goalSize', size)
    saveDrillField(selectedDrill.id, 'goal_size', size)
  }

  // ── Second canvas handlers ──────────────────────────────────────────────

  function handleSvgClick2(e) {
    const sc = selectedDrill?.secondCanvas
    if (!sc) return
    const { cx, cy } = svgCoords2(e, e.currentTarget)

    if (activeTool === 'red-player' || activeTool === 'blue-player') {
      const team = activeTool === 'red-player' ? 'red' : 'blue'
      const newPlayer = { id: crypto.randomUUID(), team, cx, cy, label: 'CM', name: '' }
      const updatedPlayers = [...(sc.players ?? []), newPlayer]
      handleDrillFieldChange('secondCanvas', { ...sc, players: updatedPlayers })
      savePitchState2(updatedPlayers, sc.arrows, sc.elements)
      return
    }
    if (activeTool === 'ball' || activeTool === 'cone') {
      const newEl = { id: crypto.randomUUID(), type: activeTool, cx, cy }
      const updatedElements = [...(sc.elements ?? []), newEl]
      handleDrillFieldChange('secondCanvas', { ...sc, elements: updatedElements })
      savePitchState2(sc.players, sc.arrows, updatedElements)
      return
    }
    if (activeTool === 'move-arrow' || activeTool === 'pass-arrow') {
      if (!arrowStart2) {
        setArrowStart2({ cx, cy })
      } else {
        const type = activeTool === 'move-arrow' ? 'move' : 'pass'
        const newArrow = { id: crypto.randomUUID(), type, d: `M${arrowStart2.cx} ${arrowStart2.cy} L${cx} ${cy}` }
        const updatedArrows = [...(sc.arrows ?? []), newArrow]
        handleDrillFieldChange('secondCanvas', { ...sc, arrows: updatedArrows })
        savePitchState2(sc.players, updatedArrows, sc.elements)
        setArrowStart2(null)
        setPreviewLine2(null)
      }
    }
  }

  function handleSvgMouseDown2(e) {
    if (e.button !== 0) return
    if (activeTool !== 'zone-circle' && activeTool !== 'zone-rect') return
    if (!selectedDrill?.secondCanvas) return
    if (dragCandidateRef2.current || draggingRef2.current) return
    const { cx, cy } = svgCoords2(e, e.currentTarget)
    setZoneDrawing2({ active: true, startX: cx, startY: cy, currentX: cx, currentY: cy, type: activeTool })
  }

  function handleSvgMouseMove2(e) {
    const svgEl = e.currentTarget

    if (zoneDrawing2?.active) {
      const { cx, cy } = svgCoords2(e, svgEl)
      setZoneDrawing2(prev => prev ? { ...prev, currentX: cx, currentY: cy } : null)
      return
    }

    if (dragCandidateRef2.current) {
      const dc = dragCandidateRef2.current
      const dx = e.clientX - dc.startX
      const dy = e.clientY - dc.startY
      if (!dc.isDragging && Math.sqrt(dx * dx + dy * dy) > 6) {
        dc.isDragging = true
      }
      if (dc.isDragging) {
        const { cx, cy } = svgCoords2(e, svgEl)
        if (dc.type === 'player') {
          setSelectedDrill(prev => ({ ...prev, secondCanvas: { ...prev.secondCanvas, players: prev.secondCanvas.players.map(p => p.id === dc.id ? { ...p, cx, cy } : p) } }))
          setDrills(prev => prev.map(d => d.id === selectedDrill?.id
            ? { ...d, secondCanvas: { ...d.secondCanvas, players: d.secondCanvas.players.map(p => p.id === dc.id ? { ...p, cx, cy } : p) } }
            : d))
        } else if (dc.type === 'cone') {
          setSelectedDrill(prev => ({ ...prev, secondCanvas: { ...prev.secondCanvas, elements: prev.secondCanvas.elements.map(el => el.id === dc.id ? { ...el, cx, cy } : el) } }))
          setDrills(prev => prev.map(d => d.id === selectedDrill?.id
            ? { ...d, secondCanvas: { ...d.secondCanvas, elements: d.secondCanvas.elements.map(el => el.id === dc.id ? { ...el, cx, cy } : el) } }
            : d))
        }
      }
      return
    }

    if (draggingRef2.current) {
      const { cx, cy } = svgCoords2(e, svgEl)
      const { id: dragId } = draggingRef2.current
      setSelectedDrill(prev => ({ ...prev, secondCanvas: { ...prev.secondCanvas, elements: prev.secondCanvas.elements.map(el => el.id === dragId ? { ...el, cx, cy } : el) } }))
      setDrills(prev => prev.map(d => d.id === selectedDrill?.id
        ? { ...d, secondCanvas: { ...d.secondCanvas, elements: d.secondCanvas.elements.map(el => el.id === dragId ? { ...el, cx, cy } : el) } }
        : d))
      return
    }

    if (arrowStart2 && (activeTool === 'move-arrow' || activeTool === 'pass-arrow')) {
      const { cx, cy } = svgCoords2(e, svgEl)
      setPreviewLine2({ x1: arrowStart2.cx, y1: arrowStart2.cy, x2: cx, y2: cy })
    }
  }

  function handleSvgMouseUp2(e) {
    const sc = selectedDrill?.secondCanvas

    if (zoneDrawing2?.active) {
      const { cx: endX, cy: endY } = svgCoords2(e, e.currentTarget)
      const dx = endX - zoneDrawing2.startX
      const dy = endY - zoneDrawing2.startY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist >= 10 && sc) {
        let newZone
        if (zoneDrawing2.type === 'zone-circle') {
          newZone = {
            id: crypto.randomUUID(), type: 'zone-circle',
            cx: (zoneDrawing2.startX + endX) / 2,
            cy: (zoneDrawing2.startY + endY) / 2,
            r: dist / 2,
            color: activeZoneColor,
          }
        } else {
          newZone = {
            id: crypto.randomUUID(), type: 'zone-rect',
            x: Math.min(zoneDrawing2.startX, endX),
            y: Math.min(zoneDrawing2.startY, endY),
            width: Math.abs(dx),
            height: Math.abs(dy),
            color: activeZoneColor,
          }
        }
        const updatedElements = [...(sc.elements ?? []), newZone]
        handleDrillFieldChange('secondCanvas', { ...sc, elements: updatedElements })
        savePitchState2(sc.players, sc.arrows, updatedElements)
      }
      setZoneDrawing2(null)
      return
    }

    if (dragCandidateRef2.current) {
      const dc = dragCandidateRef2.current
      dragCandidateRef2.current = null
      if (!sc) return
      if (dc.isDragging) {
        savePitchState2(sc.players, sc.arrows, sc.elements)
      } else {
        if (activeTool === null && dc.type === 'player') {
          const p = sc.players.find(pl => pl.id === dc.id)
          if (p) setLabelEditor2({ id: p.id, cx: p.cx, cy: p.cy, label: p.label, name: p.name })
        }
      }
      return
    }

    if (draggingRef2.current) {
      const { cx, cy } = svgCoords2(e, e.currentTarget)
      const { id: dragId } = draggingRef2.current
      draggingRef2.current = null
      if (!sc) return
      const updated = sc.elements.map(el => el.id === dragId ? { ...el, cx, cy } : el)
      handleDrillFieldChange('secondCanvas', { ...sc, elements: updated })
      savePitchState2(sc.players, sc.arrows, updated)
    }
  }

  function handlePlayerMouseDown2(e, player) {
    if (e.button !== 0) return
    e.preventDefault()
    dragCandidateRef2.current = { id: player.id, type: 'player', startX: e.clientX, startY: e.clientY, isDragging: false }
  }

  function handleElementMouseDown2(e, el) {
    if (e.button !== 0) return
    e.preventDefault()
    if (el.type === 'cone') {
      dragCandidateRef2.current = { id: el.id, type: 'cone', startX: e.clientX, startY: e.clientY, isDragging: false }
    } else {
      draggingRef2.current = { id: el.id, type: 'element' }
    }
  }

  function handleContextMenu2(e, itemId, arrayField) {
    e.preventDefault()
    const sc = selectedDrill?.secondCanvas
    if (!sc) return
    const updated = (sc[arrayField] ?? []).filter(item => item.id !== itemId)
    handleDrillFieldChange('secondCanvas', { ...sc, [arrayField]: updated })
    savePitchState2(
      arrayField === 'players' ? updated : sc.players,
      arrayField === 'arrows' ? updated : sc.arrows,
      arrayField === 'elements' ? updated : sc.elements,
    )
  }

  function saveLabelEdit2() {
    const sc = selectedDrill?.secondCanvas
    if (!labelEditor2 || !sc) return
    const updated = sc.players.map(p =>
      p.id === labelEditor2.id ? { ...p, label: labelEditor2.label, name: labelEditor2.name } : p
    )
    handleDrillFieldChange('secondCanvas', { ...sc, players: updated })
    savePitchState2(updated, sc.arrows, sc.elements)
    setLabelEditor2(null)
  }

  function handleCropChange2(crop) {
    const sc = selectedDrill?.secondCanvas
    if (!sc) return
    if (crop === 'custom') {
      const jsonStr = JSON.stringify({ type: 'custom', top: 0, left: 0, right: VIEW_DIMS.full.w, bottom: VIEW_DIMS.full.h })
      setActiveCrop2(jsonStr)
      const newSc = { ...sc, pitchCrop: jsonStr }
      handleDrillFieldChange('secondCanvas', newSc)
      showSave('saving')
      supabase.from('drills').update({ second_canvas: { players: newSc.players, arrows: newSc.arrows, elements: newSc.elements, pitch_crop: jsonStr } }).eq('id', selectedDrill.id).then(({ error }) => {
        error ? showSave('Save failed') : showSave('saved')
      })
      setCropEditingActive2(true)
    } else {
      setActiveCrop2(crop)
      const newSc = { ...sc, pitchCrop: crop }
      handleDrillFieldChange('secondCanvas', newSc)
      showSave('saving')
      supabase.from('drills').update({ second_canvas: { players: newSc.players, arrows: newSc.arrows, elements: newSc.elements, pitch_crop: crop } }).eq('id', selectedDrill.id).then(({ error }) => {
        error ? showSave('Save failed') : showSave('saved')
      })
      setCropEditingActive2(false)
    }
  }

  function handleCustomCropSave2(jsonStr) {
    const sc = selectedDrill?.secondCanvas
    if (!sc) return
    setActiveCrop2(jsonStr)
    const newSc = { ...sc, pitchCrop: jsonStr }
    handleDrillFieldChange('secondCanvas', newSc)
    setCropEditingActive2(false)
    showSave('saving')
    supabase.from('drills').update({ second_canvas: { players: newSc.players, arrows: newSc.arrows, elements: newSc.elements, pitch_crop: jsonStr } }).eq('id', selectedDrill.id).then(({ error }) => {
      error ? showSave('Save failed') : showSave('saved')
    })
  }

  async function handleAddSecondCanvas() {
    const empty = { players: [], arrows: [], elements: [], pitchCrop: 'full' }
    handleDrillFieldChange('secondCanvas', empty)
    setActiveCrop2('full')
    showSave('saving')
    const { error } = await supabase.from('drills').update({ second_canvas: { players: [], arrows: [], elements: [], pitch_crop: 'full' } }).eq('id', selectedDrill.id)
    error ? showSave('Save failed') : showSave('saved')
  }

  async function handleRemoveSecondCanvas() {
    handleDrillFieldChange('secondCanvas', null)
    setActiveCrop2('full')
    setArrowStart2(null)
    setPreviewLine2(null)
    setLabelEditor2(null)
    setZoneDrawing2(null)
    setSelectedElement2(null)
    setCropEditingActive2(false)
    showSave('saving')
    const { error } = await supabase.from('drills').update({ second_canvas: null }).eq('id', selectedDrill.id)
    error ? showSave('Save failed') : showSave('saved')
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
          <button className="tb-btn" onClick={() => window.open(`/admin/plans/${id}/print`, '_blank', 'noreferrer')}>Print</button>
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
                {!isMobile && (
                  <>
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
                      {['third', 'half', 'full', 'blank', 'custom'].map(crop => (
                        <button
                          key={crop}
                          className={`pt-btn${parseCropType(activeCrop) === crop ? ' active' : ''}`}
                          onClick={() => handleCropChange(crop)}
                        >
                          {crop === 'blank' ? 'Blank' : crop.charAt(0).toUpperCase() + crop.slice(1)}
                        </button>
                      ))}
                      {parseCropType(activeCrop) === 'custom' && (
                        <button
                          className="pt-btn pt-btn--edit-crop"
                          onClick={() => setCropEditingActive(true)}
                        >
                          Edit crop
                        </button>
                      )}
                      <div className="pt-divider" />
                      <span className="pt-label">Zones:</span>
                      {[['zone-circle', 'Zone ○'], ['zone-rect', 'Zone □']].map(([tool, label]) => (
                        <button
                          key={tool}
                          className={`pt-btn${activeTool === tool ? ' active' : ''}`}
                          onClick={() => setActiveTool(prev => prev === tool ? null : tool)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {(activeTool === 'zone-circle' || activeTool === 'zone-rect') && (
                      <div className="pitch-toolbar pitch-toolbar--zone-colors">
                        <span className="pt-label">Colour:</span>
                        {['gold', 'red', 'blue'].map(color => (
                          <button
                            key={color}
                            className={`pt-color-btn pt-color-btn--${color}${activeZoneColor === color ? ' active' : ''}`}
                            onClick={() => setActiveZoneColor(color)}
                            title={color.charAt(0).toUpperCase() + color.slice(1)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
                <div className="pitch-canvas-wrap">
                  <div className="pitch-editor-wrap" style={{ cursor: activeTool ? 'crosshair' : 'default' }}>
                    <PitchCanvas
                      interactive
                      isMobile={isMobile}
                      crop={activeCrop}
                      cropEditingActive={cropEditingActive}
                      players={selectedDrill.players ?? []}
                      arrows={selectedDrill.arrows ?? []}
                      elements={selectedDrill.elements ?? []}
                      goalSize={activeGoalSize}
                      activeTool={activeTool}
                      arrowStart={arrowStart}
                      previewLine={previewLine}
                      labelEditor={labelEditor}
                      zoneDrawing={zoneDrawing}
                      onSvgClick={handleSvgClick}
                      onSvgMouseDown={handleSvgMouseDown}
                      onSvgMouseMove={handleSvgMouseMove}
                      onSvgMouseUp={handleSvgMouseUp}
                      onPlayerMouseDown={handlePlayerMouseDown}
                      onElementMouseDown={handleElementMouseDown}
                      onContextMenu={handleContextMenu}
                      onLabelChange={setLabelEditor}
                      onLabelSave={saveLabelEdit}
                      onLabelClose={() => setLabelEditor(null)}
                      selectedElement={selectedElement}
                      onMobileElementTap={handleMobileElementTap}
                      onMobileSvgTap={handleMobileSvgTap}
                      onSvgRef={el => { mobileSvgElRef.current = el }}
                      onCustomCropSave={handleCustomCropSave}
                      onCropEditingCancel={() => setCropEditingActive(false)}
                    />
                  </div>
                  {isMobile && (
                    <>
                      {selectedElement ? (
                        <div className="pitch-selection-toolbar">
                          <button
                            className="pst-btn pst-btn--move"
                            onTouchStart={handleMoveTouchStart}
                            onTouchMove={handleMoveTouchMove}
                            onTouchEnd={handleMoveTouchEnd}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                              <defs />
                              <line x1="8" y1="5" x2="8" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              <polygon points="8,1 5.5,5 10.5,5" fill="currentColor"/>
                              <polygon points="8,15 5.5,11 10.5,11" fill="currentColor"/>
                              <polygon points="1,8 5,5.5 5,10.5" fill="currentColor"/>
                              <polygon points="15,8 11,5.5 11,10.5" fill="currentColor"/>
                            </svg>
                            Move
                          </button>
                          {selectedElement.arrayField === 'players' && (
                            <button className="pst-btn" onClick={handleMobileEditLabel}>
                              Edit Label
                            </button>
                          )}
                          <button className="pst-btn pst-btn--delete" onClick={handleMobileDelete}>
                            Delete
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            className="pitch-fab"
                            onClick={() => setFabOpen(o => !o)}
                          >
                            {fabOpen ? '×' : '+'}
                          </button>
                          {fabOpen && (
                            <div className="pitch-fab-panel">
                              <div className="fab-section">
                                <span className="fab-section-label">Players</span>
                                {['red-player', 'blue-player'].map(tool => (
                                  <button
                                    key={tool}
                                    className={`pt-btn${activeTool === tool ? ' active' : ''}`}
                                    onClick={() => { setActiveTool(prev => prev === tool ? null : tool); setFabOpen(false) }}
                                  >
                                    {tool === 'red-player' ? '● Red' : '● Blue'}
                                  </button>
                                ))}
                              </div>
                              <div className="fab-section">
                                <span className="fab-section-label">Elements</span>
                                {[['ball', 'Ball'], ['cone', 'Cone'], ['move-arrow', 'Run →'], ['pass-arrow', 'Pass …']].map(([tool, label]) => (
                                  <button
                                    key={tool}
                                    className={`pt-btn${activeTool === tool ? ' active' : ''}`}
                                    onClick={() => { setActiveTool(prev => prev === tool ? null : tool); setFabOpen(false) }}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                              <div className="fab-section">
                                <span className="fab-section-label">Goal</span>
                                {['mini', 'small', 'medium', 'full'].map(size => (
                                  <button
                                    key={size}
                                    className={`pt-btn${activeGoalSize === size ? ' active' : ''}`}
                                    onClick={() => { handleGoalSizeChange(size); setFabOpen(false) }}
                                  >
                                    {size.charAt(0).toUpperCase() + size.slice(1)}
                                  </button>
                                ))}
                              </div>
                              <div className="fab-section">
                                <span className="fab-section-label">Pitch crop</span>
                                {['third', 'half', 'full', 'blank', 'custom'].map(crop => (
                                  <button
                                    key={crop}
                                    className={`pt-btn${parseCropType(activeCrop) === crop ? ' active' : ''}`}
                                    onClick={() => { handleCropChange(crop); setFabOpen(false) }}
                                  >
                                    {crop === 'blank' ? 'Blank' : crop.charAt(0).toUpperCase() + crop.slice(1)}
                                  </button>
                                ))}
                                {parseCropType(activeCrop) === 'custom' && (
                                  <button
                                    className="pt-btn pt-btn--edit-crop"
                                    onClick={() => { setCropEditingActive(true); setFabOpen(false) }}
                                  >
                                    Edit crop
                                  </button>
                                )}
                              </div>
                              <div className="fab-section">
                                <span className="fab-section-label">Zones</span>
                                {[['zone-circle', 'Zone ○'], ['zone-rect', 'Zone □']].map(([tool, label]) => (
                                  <button
                                    key={tool}
                                    className={`pt-btn${activeTool === tool ? ' active' : ''}`}
                                    onClick={() => { setActiveTool(prev => prev === tool ? null : tool); setFabOpen(false) }}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                              {(activeTool === 'zone-circle' || activeTool === 'zone-rect') && (
                                <div className="fab-section">
                                  <span className="fab-section-label">Colour</span>
                                  {['gold', 'red', 'blue'].map(color => (
                                    <button
                                      key={color}
                                      className={`pt-color-btn pt-color-btn--${color}${activeZoneColor === color ? ' active' : ''}`}
                                      onClick={() => { setActiveZoneColor(color); setFabOpen(false) }}
                                      title={color.charAt(0).toUpperCase() + color.slice(1)}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Second canvas section */}
              <div className="pitch-area pitch-area--second">
                {selectedDrill.secondCanvas ? (
                  <>
                    {!isMobile && (
                      <div className="pitch-toolbar">
                        <span className="pt-label">Pitch 2 crop:</span>
                        {['third', 'half', 'full', 'blank', 'custom'].map(c => (
                          <button
                            key={c}
                            className={`pt-btn${parseCropType(activeCrop2) === c ? ' active' : ''}`}
                            onClick={() => handleCropChange2(c)}
                          >
                            {c === 'blank' ? 'Blank' : c.charAt(0).toUpperCase() + c.slice(1)}
                          </button>
                        ))}
                        {parseCropType(activeCrop2) === 'custom' && (
                          <button className="pt-btn pt-btn--edit-crop" onClick={() => setCropEditingActive2(true)}>
                            Edit crop
                          </button>
                        )}
                      </div>
                    )}
                    <div className="pitch-canvas-wrap">
                      <div className="pitch-editor-wrap" style={{ cursor: activeTool ? 'crosshair' : 'default' }}>
                        <PitchCanvas
                          interactive
                          isMobile={false}
                          crop={activeCrop2}
                          cropEditingActive={cropEditingActive2}
                          players={selectedDrill.secondCanvas.players ?? []}
                          arrows={selectedDrill.secondCanvas.arrows ?? []}
                          elements={selectedDrill.secondCanvas.elements ?? []}
                          goalSize={activeGoalSize}
                          activeTool={activeTool}
                          arrowStart={arrowStart2}
                          previewLine={previewLine2}
                          labelEditor={labelEditor2}
                          zoneDrawing={zoneDrawing2}
                          onSvgClick={handleSvgClick2}
                          onSvgMouseDown={handleSvgMouseDown2}
                          onSvgMouseMove={handleSvgMouseMove2}
                          onSvgMouseUp={handleSvgMouseUp2}
                          onPlayerMouseDown={handlePlayerMouseDown2}
                          onElementMouseDown={handleElementMouseDown2}
                          onContextMenu={handleContextMenu2}
                          onLabelChange={setLabelEditor2}
                          onLabelSave={saveLabelEdit2}
                          onLabelClose={() => setLabelEditor2(null)}
                          selectedElement={selectedElement2}
                          onCustomCropSave={handleCustomCropSave2}
                          onCropEditingCancel={() => setCropEditingActive2(false)}
                        />
                      </div>
                    </div>
                    <button className="add-pitch-btn add-pitch-btn--remove" onClick={handleRemoveSecondCanvas}>
                      Remove progression pitch
                    </button>
                  </>
                ) : (
                  <button className="add-pitch-btn" onClick={handleAddSecondCanvas}>
                    + Add progression pitch
                  </button>
                )}
              </div>

              <div className={`drill-fields${selectedDrill.secondCanvas ? ' drill-fields--compact' : ''}`}>
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

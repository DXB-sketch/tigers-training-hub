import { useRef, useState, useEffect, useLayoutEffect } from 'react'

function ZoneShape({ zone, interactive, onContextMenu, onTouchStart }) {
  const stroke = zone.color === 'gold' ? 'var(--tigers-gold)'
    : zone.color === 'red' ? 'var(--player-red)'
    : 'var(--player-blue)'
  const ctxMenu = interactive
    ? e => { e.preventDefault(); onContextMenu?.(e, zone.id, 'elements') }
    : undefined

  if (zone.type === 'zone-circle') {
    return (
      <g onContextMenu={ctxMenu} onTouchStart={onTouchStart}>
        <circle cx={zone.cx} cy={zone.cy} r={zone.r}
          fill="none" strokeWidth={2} strokeDasharray="8 4" opacity={0.7}
          style={{ stroke, pointerEvents: 'none' }}
        />
        {interactive && (
          <circle cx={zone.cx} cy={zone.cy} r={zone.r}
            fill="transparent" style={{ pointerEvents: 'all', cursor: 'context-menu' }}
          />
        )}
      </g>
    )
  }
  if (zone.type === 'zone-rect') {
    return (
      <g onContextMenu={ctxMenu} onTouchStart={onTouchStart}>
        <rect x={zone.x} y={zone.y} width={zone.width} height={zone.height}
          fill="none" strokeWidth={2} strokeDasharray="8 4" opacity={0.7}
          style={{ stroke, pointerEvents: 'none' }}
        />
        {interactive && (
          <rect x={zone.x} y={zone.y} width={zone.width} height={zone.height}
            fill="transparent" style={{ pointerEvents: 'all', cursor: 'context-menu' }}
          />
        )}
      </g>
    )
  }
  return null
}

// Arrow colors are SVG-specific fixed values per DESIGN.md (not in tokens.css)
const ARROW_MOVE = '#f0a500'
const ARROW_PASS = '#4477cc'

const VIEW_BOXES = {
  full:   '0 0 720 480',
  half:   '0 0 720 280',
  third:  '0 0 720 185',
  custom: '0 0 720 480',
  blank:  '0 0 720 185',
}

const GOAL_WIDTHS = {
  mini: 60,
  small: 96,
  medium: 128,
  full: 192,
}

function PitchMarkings({ crop, goalWidth }) {
  if (crop === 'blank') {
    return <rect width="720" height="185" style={{ fill: 'var(--pitch-green)' }} />
  }
  const vbHeight = crop === 'full' ? 480 : crop === 'half' ? 280 : 185
  const goalX = (720 - goalWidth) / 2
  const goalY = 5
  const goalH = 12
  const penAreaW = 256
  const penAreaX = (720 - penAreaW) / 2
  const penAreaH = crop === 'third' ? 76 : 88
  const sixYardW = 128
  const sixYardX = (720 - sixYardW) / 2

  // Bottom end goal (mirrors top, using same goalWidth)
  const btmGoalX = goalX
  const btmGoalY = 462

  return (
    <>
      <rect width="720" height={vbHeight} style={{ fill: 'var(--pitch-green)' }} />
      <rect x="14" y="14" width="692" height={vbHeight - 28}
        fill="none" style={{ stroke: 'var(--pitch-line)' }} strokeWidth="1" opacity="0.5" />

      {/* Top penalty area, 6-yard box */}
      <rect x={penAreaX} y="14" width={penAreaW} height={penAreaH}
        fill="none" style={{ stroke: 'var(--pitch-line)' }} strokeWidth="0.8" opacity="0.45" />
      <rect x={sixYardX} y="14" width={sixYardW} height="36"
        fill="none" style={{ stroke: 'var(--pitch-line)' }} strokeWidth="0.8" opacity="0.45" />

      {/* Top goal */}
      <rect x={goalX} y={goalY} width={goalWidth} height={goalH}
        fill="#3a7525" stroke="#fff" strokeWidth="2.5" />
      <line x1={goalX} y1={goalY} x2={goalX} y2={goalY + goalH} stroke="#fff" strokeWidth="2.5" />
      <line x1={goalX + goalWidth} y1={goalY} x2={goalX + goalWidth} y2={goalY + goalH} stroke="#fff" strokeWidth="2.5" />
      <line x1={goalX} y1={goalY + goalH} x2={goalX + goalWidth} y2={goalY + goalH} stroke="#fff" strokeWidth="2.5" />

      {/* Top penalty spot */}
      <circle cx="360" cy="76" r="2.5" style={{ fill: 'var(--pitch-line)' }} opacity="0.5" />

      {/* Half crop: show halfway line peeking in at bottom */}
      {crop === 'half' && (
        <>
          <line x1="14" y1="262" x2="706" y2="262"
            style={{ stroke: 'var(--pitch-line)' }} strokeWidth="1" opacity="0.4" />
          <path d="M 314 262 A 52 52 0 0 0 406 262"
            fill="none" style={{ stroke: 'var(--pitch-line)' }} strokeWidth="0.8" opacity="0.35" />
        </>
      )}

      {/* Full crop: halfway line, centre circle, centre spot, bottom end markings */}
      {crop === 'full' && (
        <>
          {/* Halfway line */}
          <line x1="14" y1="240" x2="706" y2="240"
            style={{ stroke: 'var(--pitch-line)' }} strokeWidth="1" opacity="0.4" />
          {/* Centre circle */}
          <circle cx="360" cy="240" r="52"
            fill="none" style={{ stroke: 'var(--pitch-line)' }} strokeWidth="0.8" opacity="0.35" />
          {/* Centre spot */}
          <circle cx="360" cy="240" r="2.5" style={{ fill: 'var(--pitch-line)' }} opacity="0.5" />

          {/* Bottom penalty area */}
          <rect x="232" y="388" width="256" height="92"
            fill="none" style={{ stroke: 'var(--pitch-line)' }} strokeWidth="0.8" opacity="0.45" />
          {/* Bottom 6-yard box */}
          <rect x="296" y="430" width="128" height="38"
            fill="none" style={{ stroke: 'var(--pitch-line)' }} strokeWidth="0.8" opacity="0.45" />
          {/* Bottom goal */}
          <rect x={btmGoalX} y={btmGoalY} width={goalWidth} height={goalH}
            fill="#3a7525" stroke="#fff" strokeWidth="2.5" />
          <line x1={btmGoalX} y1={btmGoalY} x2={btmGoalX} y2={btmGoalY + goalH} stroke="#fff" strokeWidth="2.5" />
          <line x1={btmGoalX + goalWidth} y1={btmGoalY} x2={btmGoalX + goalWidth} y2={btmGoalY + goalH} stroke="#fff" strokeWidth="2.5" />
          <line x1={btmGoalX} y1={btmGoalY + goalH} x2={btmGoalX + goalWidth} y2={btmGoalY + goalH} stroke="#fff" strokeWidth="2.5" />
          {/* Bottom penalty spot */}
          <circle cx="360" cy="402" r="2.5" style={{ fill: 'var(--pitch-line)' }} opacity="0.5" />
        </>
      )}
    </>
  )
}

// Issue 5: players have a transparent hit-area circle (r=22) on top of the visible circle
function PlayerDot({ cx, cy, team, label, name, interactive, onMouseDown, onContextMenu, onTouchStart }) {
  const fillVar = team === 'red' ? 'var(--player-red)' : 'var(--player-blue)'
  return (
    <g
      style={{ cursor: interactive ? 'grab' : 'default' }}
      onMouseDown={interactive ? onMouseDown : undefined}
      onContextMenu={interactive ? onContextMenu : undefined}
      onTouchStart={onTouchStart}
    >
      <circle cx={cx} cy={cy} r="14" style={{ fill: fillVar }} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fill="white" fontFamily="Arial" fontWeight="700">
        {label}
      </text>
      {name && (
        <text x={cx} y={cy + 24} textAnchor="middle" fontSize="9" fill="#e8e0cc" fontFamily="Arial">
          {name}
        </text>
      )}
      {/* Transparent hit area — wider than the visible dot */}
      {interactive && (
        <circle cx={cx} cy={cy} r="22" fill="transparent" style={{ pointerEvents: 'all' }} />
      )}
    </g>
  )
}

// Issue 5: arrows have a wide transparent duplicate path for easier right-click
function Arrow({ d, type, interactive, onContextMenu, onTouchStart }) {
  const color = type === 'move' ? ARROW_MOVE : ARROW_PASS
  const width = type === 'move' ? 2 : 1.6
  const dash = type === 'move' ? '7,4' : '4,3'
  const marker = type === 'move' ? 'url(#aMove)' : 'url(#aPass)'
  return (
    <>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dash}
        markerEnd={marker}
        style={{ pointerEvents: 'none' }}
      />
      {interactive && (
        <path
          d={d}
          fill="none"
          stroke="transparent"
          strokeWidth={14}
          style={{ pointerEvents: 'all', cursor: 'context-menu' }}
          onContextMenu={onContextMenu}
          onTouchStart={onTouchStart}
        />
      )}
    </>
  )
}

function Element({ el, interactive, onMouseDown, onContextMenu, onTouchStart }) {
  if (el.type === 'zone') {
    return (
      <ellipse cx={el.cx} cy={el.cy} rx={el.rx ?? 40} ry={el.ry ?? 30}
        fill="rgba(240,165,0,0.06)" stroke={ARROW_MOVE}
        strokeWidth="1.2" strokeDasharray="6,4"
        onContextMenu={interactive ? onContextMenu : undefined}
        onTouchStart={onTouchStart}
      />
    )
  }
  if (el.type === 'ball') {
    return (
      <g
        style={{ cursor: interactive ? 'grab' : 'default' }}
        onMouseDown={interactive ? onMouseDown : undefined}
        onContextMenu={interactive ? onContextMenu : undefined}
        onTouchStart={onTouchStart}
      >
        <circle cx={el.cx} cy={el.cy} r="10" fill="transparent" style={{ pointerEvents: 'all' }} />
        <circle cx={el.cx} cy={el.cy} r="7" fill="#ececec" stroke="#999" strokeWidth="1" />
        <circle cx={el.cx} cy={el.cy} r="3" fill="#333" />
      </g>
    )
  }
  // Issue 5: cone has transparent hit area (r=18); polygon is pointerEvents none
  if (el.type === 'cone') {
    return (
      <g
        style={{ cursor: interactive ? 'grab' : 'default' }}
        onMouseDown={interactive ? onMouseDown : undefined}
        onContextMenu={interactive ? onContextMenu : undefined}
        onTouchStart={onTouchStart}
      >
        <circle cx={el.cx} cy={el.cy} r="18" fill="transparent" style={{ pointerEvents: 'all' }} />
        <polygon
          points={`${el.cx},${el.cy - 9} ${el.cx - 7},${el.cy + 6} ${el.cx + 7},${el.cy + 6}`}
          fill="#f0a500"
          stroke="#c88000"
          strokeWidth="0.8"
          style={{ pointerEvents: 'none' }}
        />
      </g>
    )
  }
  return null
}

function LabelEditor({ player, onLabelChange, onSave, onClose }) {
  const { cx, cy, label, name } = player
  const labelW = 124
  const labelH = 72
  const aboveY = cy - 64
  const foY = aboveY < 10 ? cy + 16 : aboveY
  const foX = Math.max(10, Math.min(cx - labelW / 2, 720 - labelW - 10))
  return (
    <foreignObject x={foX} y={foY} width={labelW} height={labelH}>
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        style={{ background: '#fff', border: '1px solid #ccc', padding: '6px', display: 'flex', flexDirection: 'column', gap: 4 }}
      >
        <input
          type="text"
          maxLength={3}
          value={label}
          onChange={e => onLabelChange(prev => ({ ...prev, label: e.target.value }))}
          placeholder="CM"
          autoFocus
          style={{ width: '100%', fontSize: 11, border: '1px solid #ccc', padding: '2px 4px', fontFamily: 'Arial', boxSizing: 'border-box' }}
        />
        <input
          type="text"
          value={name}
          onChange={e => onLabelChange(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g. Left back"
          onKeyDown={e => { if (e.key === 'Enter') onSave() }}
          style={{ width: '100%', fontSize: 11, border: '1px solid #ccc', padding: '2px 4px', fontFamily: 'Arial', boxSizing: 'border-box' }}
        />
      </div>
    </foreignObject>
  )
}

export default function PitchCanvas({
  crop = 'third',
  players = [],
  arrows = [],
  elements = [],
  goalSize = 'medium',
  interactive = false,
  isMobile = false,
  cropEditingActive = false,
  activeTool,
  arrowStart,
  previewLine,
  labelEditor,
  zoneDrawing,
  selectedElement,
  onSvgClick,
  onSvgMouseDown,
  onSvgMouseMove,
  onSvgMouseUp,
  onPlayerMouseDown,
  onElementMouseDown,
  onContextMenu,
  onLabelChange,
  onLabelSave,
  onLabelClose,
  onMobileElementTap,
  onMobileSvgTap,
  onSvgRef,
  onCustomCropSave,
  onCropEditingCancel,
}) {
  const svgRef = useRef(null)
  const wrapRef = useRef(null)
  const touchStateRef = useRef(null)
  const tappedElementRef = useRef(null)
  const activeToolRef = useRef(activeTool)
  activeToolRef.current = activeTool
  const onMobileElementTapRef = useRef(onMobileElementTap)
  onMobileElementTapRef.current = onMobileElementTap
  const onMobileSvgTapRef = useRef(onMobileSvgTap)
  onMobileSvgTapRef.current = onMobileSvgTap
  const [transform, setTransform] = useState({ scale: 1.6, translateX: 0, translateY: 0 })
  const transformRef = useRef(transform)
  transformRef.current = transform

  const [localBounds, setLocalBounds] = useState(null)
  const localBoundsRef = useRef(null)
  const cropDragRef = useRef(null)
  const savedCropSnapshotRef = useRef(null)

  const safePlayers = Array.isArray(players) ? players : []
  const safeArrows = Array.isArray(arrows) ? arrows : []
  const safeElements = Array.isArray(elements) ? elements : []

  let parsedCustomCrop = null
  try {
    if (typeof crop === 'string' && crop.startsWith('{')) {
      const obj = JSON.parse(crop)
      if (obj && obj.type === 'custom') parsedCustomCrop = obj
    }
  } catch {}
  const isCustomCrop = parsedCustomCrop !== null

  const resolvedCrop = isCustomCrop ? 'full' : (crop === 'custom' ? 'half' : crop)
  let viewBox
  if (isCustomCrop) {
    if (interactive && cropEditingActive) {
      viewBox = VIEW_BOXES.full
    } else if (parsedCustomCrop) {
      const { left, top, right, bottom } = parsedCustomCrop
      viewBox = `${left} ${top} ${right - left} ${bottom - top}`
    } else {
      viewBox = VIEW_BOXES.full
    }
  } else {
    viewBox = VIEW_BOXES[resolvedCrop] ?? VIEW_BOXES.third
  }
  const goalWidth = GOAL_WIDTHS[goalSize] ?? GOAL_WIDTHS.medium

  const vbParts = viewBox.split(' ').map(Number)
  const vbW = vbParts[2]
  const vbH = vbParts[3]

  const displayBounds = localBounds ?? (parsedCustomCrop
    ? { top: parsedCustomCrop.top, left: parsedCustomCrop.left, right: parsedCustomCrop.right, bottom: parsedCustomCrop.bottom }
    : null)

  // Set initial transform centred on crop centre whenever crop/mobile state changes
  useLayoutEffect(() => {
    if (!interactive || !isMobile || !wrapRef.current) return
    const wrapW = wrapRef.current.clientWidth
    const wrapH = wrapW * vbH / vbW
    setTransform({
      scale: 1.6,
      translateX: (wrapW * (1 - 1.6)) / 2,
      translateY: (wrapH * (1 - 1.6)) / 2,
    })
  }, [crop, interactive, isMobile, vbH, vbW])

  // Non-passive touch listeners for pan and pinch (mobile interactive only)
  useEffect(() => {
    if (!interactive || !isMobile || !wrapRef.current) return
    const wrap = wrapRef.current
    const fit = 1.0

    function clampT(tx, ty, scale) {
      const ww = wrap.clientWidth
      const wh = ww * vbH / vbW
      return {
        translateX: Math.max(ww * (1 - scale), Math.min(0, tx)),
        translateY: Math.max(wh * (1 - scale), Math.min(0, ty)),
      }
    }

    function touchDist(t1, t2) {
      return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
    }

    function onTouchStart(e) {
      if (e.touches.length === 1) {
        touchStateRef.current = {
          type: 'pan',
          lastX: e.touches[0].clientX,
          lastY: e.touches[0].clientY,
          hasMoved: false,
        }
      } else if (e.touches.length === 2) {
        touchStateRef.current = {
          type: 'pinch',
          lastDist: touchDist(e.touches[0], e.touches[1]),
          snapReady: Math.abs(transformRef.current.scale - fit) < 0.05,
        }
      }
    }

    function onTouchMove(e) {
      const ts = touchStateRef.current
      if (!ts) return

      if (ts.type === 'pan' && e.touches.length === 1) {
        const t = e.touches[0]
        const dx = t.clientX - ts.lastX
        const dy = t.clientY - ts.lastY
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) ts.hasMoved = true
        if (ts.hasMoved) {
          e.preventDefault()
          setTransform(prev => ({ scale: prev.scale, ...clampT(prev.translateX + dx, prev.translateY + dy, prev.scale) }))
        }
        ts.lastX = t.clientX
        ts.lastY = t.clientY
      } else if (ts.type === 'pinch' && e.touches.length >= 2) {
        e.preventDefault()
        const dist = touchDist(e.touches[0], e.touches[1])
        const ratio = dist / ts.lastDist
        ts.lastDist = dist

        setTransform(prev => {
          let newScale
          if (ratio < 1) {
            // Pinch-in: scale increases toward 1.6; snap from near-fit
            if (ts.snapReady && Math.abs(prev.scale - fit) < 0.05) {
              ts.snapReady = false
              const ww = wrap.clientWidth
              const wh = ww * vbH / vbW
              return { scale: 1.6, translateX: (ww * (1 - 1.6)) / 2, translateY: (wh * (1 - 1.6)) / 2 }
            }
            newScale = Math.min(1.6, prev.scale / ratio)
          } else {
            // Pinch-out: scale decreases toward fit
            newScale = Math.max(fit, prev.scale / ratio)
          }
          const rect = wrap.getBoundingClientRect()
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
          const svgX = (midX - prev.translateX) / prev.scale
          const svgY = (midY - prev.translateY) / prev.scale
          return { scale: newScale, ...clampT(midX - svgX * newScale, midY - svgY * newScale, newScale) }
        })
      }
    }

    function onTouchEnd(e) {
      const ts = touchStateRef.current
      if (e.touches.length === 1 && ts?.type === 'pinch') {
        touchStateRef.current = {
          type: 'pan',
          lastX: e.touches[0].clientX,
          lastY: e.touches[0].clientY,
          hasMoved: false,
        }
        return
      }
      if (!activeToolRef.current && ts && !ts.hasMoved) {
        const tapped = tappedElementRef.current
        if (tapped) {
          onMobileElementTapRef.current?.(tapped.id, tapped.arrayField, tapped.elementType)
        } else {
          onMobileSvgTapRef.current?.()
        }
      }
      tappedElementRef.current = null
      touchStateRef.current = null
    }

    wrap.addEventListener('touchstart', onTouchStart, { passive: false })
    wrap.addEventListener('touchmove', onTouchMove, { passive: false })
    wrap.addEventListener('touchend', onTouchEnd, { passive: false })
    return () => {
      wrap.removeEventListener('touchstart', onTouchStart)
      wrap.removeEventListener('touchmove', onTouchMove)
      wrap.removeEventListener('touchend', onTouchEnd)
    }
  }, [interactive, isMobile, vbH, vbW])

  useEffect(() => {
    if (parsedCustomCrop) {
      const b = { top: parsedCustomCrop.top, left: parsedCustomCrop.left, right: parsedCustomCrop.right, bottom: parsedCustomCrop.bottom }
      setLocalBounds(b)
      localBoundsRef.current = b
    } else {
      setLocalBounds(null)
      localBoundsRef.current = null
    }
  }, [crop])

  useEffect(() => {
    if (cropEditingActive) {
      savedCropSnapshotRef.current = localBoundsRef.current ? { ...localBoundsRef.current } : null
    }
  }, [cropEditingActive])

  // Issue 3: detect click outside label editor and close it
  function handleMouseDown(e) {
    if (labelEditor && svgRef.current) {
      const fo = svgRef.current.querySelector('foreignObject')
      if (fo && !fo.contains(e.target)) {
        onLabelSave?.()
      }
    }
    onSvgMouseDown?.(e)
  }

  function getSvgPoint(e) {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (vbW / rect.width),
      y: (e.clientY - rect.top) * (vbH / rect.height),
    }
  }

  function handleCropHandleMouseDown(e, handleId) {
    e.stopPropagation()
    const pt = getSvgPoint(e)
    cropDragRef.current = {
      handle: handleId,
      startX: pt.x,
      startY: pt.y,
      startBounds: { ...localBoundsRef.current },
    }
  }

  function handleMouseMove(e) {
    if (cropDragRef.current) {
      const { handle, startX, startY, startBounds } = cropDragRef.current
      const pt = getSvgPoint(e)
      const dx = pt.x - startX
      const dy = pt.y - startY
      const MIN = 40
      const next = { ...startBounds }
      if (handle === 'top' || handle === 'tl' || handle === 'tr') {
        next.top = Math.max(0, Math.min(startBounds.top + dy, startBounds.bottom - MIN))
      }
      if (handle === 'bottom' || handle === 'bl' || handle === 'br') {
        next.bottom = Math.max(startBounds.top + MIN, Math.min(startBounds.bottom + dy, vbH))
      }
      if (handle === 'left' || handle === 'tl' || handle === 'bl') {
        next.left = Math.max(0, Math.min(startBounds.left + dx, startBounds.right - MIN))
      }
      if (handle === 'right' || handle === 'tr' || handle === 'br') {
        next.right = Math.max(startBounds.left + MIN, Math.min(startBounds.right + dx, vbW))
      }
      setLocalBounds(next)
      localBoundsRef.current = next
      return
    }
    onSvgMouseMove?.(e)
  }

  function finalizeCropDrag() {
    if (!cropDragRef.current) return false
    cropDragRef.current = null
    return true
  }

  function handleMouseUp(e) {
    if (finalizeCropDrag()) return
    onSvgMouseUp?.(e)
  }

  function handleMouseLeave(e) {
    if (finalizeCropDrag()) return
    onSvgMouseUp?.(e)
  }

  const interactiveProps = interactive ? {
    onClick: onSvgClick,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
  } : {}

  const mobileTransform = interactive && isMobile

  const svgNode = (
    <svg
      ref={el => { svgRef.current = el; onSvgRef?.(el) }}
      viewBox={viewBox}
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
        cursor: interactive && activeTool ? 'crosshair' : 'default',
        ...(mobileTransform ? {
          transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        } : {}),
      }}
      {...interactiveProps}
    >
      <defs>
        <marker id="aMove" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M1 2 L8 5 L1 8" fill="none" stroke={ARROW_MOVE}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
        <marker id="aPass" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M1 2 L8 5 L1 8" fill="none" stroke={ARROW_PASS}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      <PitchMarkings crop={isCustomCrop ? 'full' : resolvedCrop} goalWidth={goalWidth} />

      {/* Zone elements render first (background layer) */}
      {safeElements
        .filter(el => el.type === 'zone-circle' || el.type === 'zone-rect')
        .map(el => (
          <ZoneShape
            key={el.id}
            zone={el}
            interactive={interactive}
            onContextMenu={onContextMenu}
            onTouchStart={isMobile && interactive && !activeTool
              ? () => { tappedElementRef.current = { id: el.id, arrayField: 'elements', elementType: el.type } }
              : undefined}
          />
        ))
      }

      {/* Non-zone elements (cones, balls, zone ellipse) */}
      {safeElements
        .filter(el => el.type !== 'zone-circle' && el.type !== 'zone-rect')
        .map(el => (
          <Element
            key={el.id}
            el={el}
            interactive={interactive}
            onMouseDown={e => onElementMouseDown?.(e, el)}
            onContextMenu={e => { e.preventDefault(); onContextMenu?.(e, el.id, 'elements') }}
            onTouchStart={isMobile && interactive && !activeTool
              ? () => { tappedElementRef.current = { id: el.id, arrayField: 'elements', elementType: el.type } }
              : undefined}
          />
        ))
      }

      {safeArrows.map(arrow => (
        <Arrow
          key={arrow.id}
          d={arrow.d}
          type={arrow.type}
          interactive={interactive}
          onContextMenu={e => { e.preventDefault(); onContextMenu?.(e, arrow.id, 'arrows') }}
          onTouchStart={isMobile && interactive && !activeTool
            ? () => { tappedElementRef.current = { id: arrow.id, arrayField: 'arrows', elementType: 'arrow' } }
            : undefined}
        />
      ))}

      {safePlayers.map(p => (
        <PlayerDot
          key={p.id}
          cx={p.cx}
          cy={p.cy}
          team={p.team}
          label={p.label}
          name={p.name}
          interactive={interactive}
          onMouseDown={e => onPlayerMouseDown?.(e, p)}
          onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onContextMenu?.(e, p.id, 'players') }}
          onTouchStart={isMobile && interactive && !activeTool
            ? () => { tappedElementRef.current = { id: p.id, arrayField: 'players', elementType: 'player' } }
            : undefined}
        />
      ))}

      {interactive && zoneDrawing?.active && (() => {
        const { startX, startY, currentX, currentY, type } = zoneDrawing
        if (type === 'zone-circle') {
          const cx = (startX + currentX) / 2
          const cy = (startY + currentY) / 2
          const dx = currentX - startX
          const dy = currentY - startY
          const r = Math.sqrt(dx * dx + dy * dy) / 2
          return (
            <circle cx={cx} cy={cy} r={r}
              fill="none" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6"
              style={{ stroke: 'var(--tigers-gold)', pointerEvents: 'none' }}
            />
          )
        }
        const x = Math.min(startX, currentX)
        const y = Math.min(startY, currentY)
        const width = Math.abs(currentX - startX)
        const height = Math.abs(currentY - startY)
        return (
          <rect x={x} y={y} width={width} height={height}
            fill="none" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6"
            style={{ stroke: 'var(--tigers-gold)', pointerEvents: 'none' }}
          />
        )
      })()}

      {interactive && previewLine && (
        <line
          x1={previewLine.x1} y1={previewLine.y1}
          x2={previewLine.x2} y2={previewLine.y2}
          stroke={activeTool === 'move-arrow' ? ARROW_MOVE : ARROW_PASS}
          strokeWidth="1.5"
          strokeDasharray="5,3"
          opacity="0.6"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {interactive && arrowStart && (
        <circle
          cx={arrowStart.cx} cy={arrowStart.cy} r="4"
          fill={activeTool === 'move-arrow' ? ARROW_MOVE : ARROW_PASS}
          opacity="0.8"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {interactive && labelEditor && (
        <LabelEditor
          player={labelEditor}
          onLabelChange={onLabelChange}
          onSave={onLabelSave}
          onClose={onLabelClose}
        />
      )}

      {interactive && selectedElement && (() => {
        const { id, arrayField } = selectedElement
        if (arrayField === 'players') {
          const p = safePlayers.find(pl => pl.id === id)
          if (!p) return null
          return <circle key="sel" cx={p.cx} cy={p.cy} r={20} fill="none" strokeWidth={1.5} style={{ stroke: 'var(--tigers-gold)', pointerEvents: 'none' }} />
        }
        if (arrayField === 'arrows') {
          const a = safeArrows.find(a => a.id === id)
          if (!a) return null
          return <path key="sel" d={a.d} fill="none" strokeWidth={5} opacity={0.4} style={{ stroke: 'var(--tigers-gold)', pointerEvents: 'none' }} />
        }
        if (arrayField === 'elements') {
          const el = safeElements.find(el => el.id === id)
          if (!el) return null
          if (el.type === 'cone') return <circle key="sel" cx={el.cx} cy={el.cy} r={14} fill="none" strokeWidth={1.5} style={{ stroke: 'var(--tigers-gold)', pointerEvents: 'none' }} />
          if (el.type === 'ball') return <circle key="sel" cx={el.cx} cy={el.cy} r={13} fill="none" strokeWidth={1.5} style={{ stroke: 'var(--tigers-gold)', pointerEvents: 'none' }} />
          if (el.type === 'zone') return <ellipse key="sel" cx={el.cx} cy={el.cy} rx={(el.rx ?? 40) + 4} ry={(el.ry ?? 30) + 4} fill="none" strokeWidth={1.5} style={{ stroke: 'var(--tigers-gold)', pointerEvents: 'none' }} />
          if (el.type === 'zone-circle') return <circle key="sel" cx={el.cx} cy={el.cy} r={el.r + 4} fill="none" strokeWidth={1.5} style={{ stroke: 'var(--tigers-gold)', pointerEvents: 'none' }} />
          if (el.type === 'zone-rect') return <rect key="sel" x={el.x - 4} y={el.y - 4} width={el.width + 8} height={el.height + 8} fill="none" strokeWidth={1.5} style={{ stroke: 'var(--tigers-gold)', pointerEvents: 'none' }} />
        }
        return null
      })()}

      {interactive && isCustomCrop && cropEditingActive && displayBounds && (() => {
        const { top, left, right, bottom } = displayBounds
        return (
          <>
            <rect x={0} y={0} width={vbW} height={top} fill="#1a1a18" opacity="0.5" style={{ pointerEvents: 'none' }} />
            <rect x={0} y={bottom} width={vbW} height={vbH - bottom} fill="#1a1a18" opacity="0.5" style={{ pointerEvents: 'none' }} />
            <rect x={0} y={top} width={left} height={bottom - top} fill="#1a1a18" opacity="0.5" style={{ pointerEvents: 'none' }} />
            <rect x={right} y={top} width={vbW - right} height={bottom - top} fill="#1a1a18" opacity="0.5" style={{ pointerEvents: 'none' }} />
          </>
        )
      })()}

      {interactive && isCustomCrop && cropEditingActive && displayBounds && (() => {
        const { top, left, right, bottom } = displayBounds
        const midX = (left + right) / 2
        const midY = (top + bottom) / 2
        const handles = [
          { id: 'top', x: midX, y: top },
          { id: 'bottom', x: midX, y: bottom },
          { id: 'left', x: left, y: midY },
          { id: 'right', x: right, y: midY },
          { id: 'tl', x: left, y: top },
          { id: 'tr', x: right, y: top },
          { id: 'bl', x: left, y: bottom },
          { id: 'br', x: right, y: bottom },
        ]
        return handles.map(h => (
          <g key={h.id} style={{ cursor: 'move' }} onMouseDown={e => handleCropHandleMouseDown(e, h.id)}>
            <rect x={h.x - 12} y={h.y - 12} width={24} height={24} fill="transparent" style={{ pointerEvents: 'all' }} />
            <rect x={h.x - 5} y={h.y - 5} width={10} height={10}
              fill="var(--surface)" stroke="var(--ink)" strokeWidth={1}
              style={{ pointerEvents: 'none' }}
            />
          </g>
        ))
      })()}
    </svg>
  )

  const cropButtons = interactive && cropEditingActive ? (
    <div style={{
      position: 'absolute',
      bottom: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '8px',
      zIndex: 10,
    }}>
      <button
        onClick={() => {
          const b = localBoundsRef.current
          if (b) {
            const jsonStr = JSON.stringify({ type: 'custom', top: b.top, left: b.left, right: b.right, bottom: b.bottom })
            onCustomCropSave?.(jsonStr)
          }
        }}
        style={{
          background: 'var(--ink)',
          color: 'var(--tigers-gold)',
          border: 'none',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          borderRadius: 0,
          minHeight: '44px',
          padding: '0 18px',
          cursor: 'pointer',
        }}
      >
        CONFIRM CROP
      </button>
      <button
        onClick={() => {
          const snap = savedCropSnapshotRef.current
          setLocalBounds(snap)
          localBoundsRef.current = snap
          onCropEditingCancel?.()
        }}
        style={{
          background: 'var(--surface)',
          color: 'var(--ink)',
          border: '1.5px solid var(--ink)',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          borderRadius: 0,
          minHeight: '44px',
          padding: '0 18px',
          cursor: 'pointer',
        }}
      >
        CANCEL
      </button>
    </div>
  ) : null

  if (mobileTransform) {
    return (
      <div ref={wrapRef} style={{ overflow: 'hidden', position: 'relative' }}>
        {svgNode}
        {cropButtons}
      </div>
    )
  }
  if (interactive && cropEditingActive) {
    return (
      <div style={{ position: 'relative' }}>
        {svgNode}
        {cropButtons}
      </div>
    )
  }
  return svgNode
}

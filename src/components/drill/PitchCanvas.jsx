import { useRef } from 'react'

function ZoneShape({ zone, interactive, onContextMenu }) {
  const stroke = zone.color === 'gold' ? 'var(--tigers-gold)'
    : zone.color === 'red' ? 'var(--player-red)'
    : 'var(--player-blue)'
  const ctxMenu = interactive
    ? e => { e.preventDefault(); onContextMenu?.(e, zone.id, 'elements') }
    : undefined

  if (zone.type === 'zone-circle') {
    return (
      <g onContextMenu={ctxMenu}>
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
      <g onContextMenu={ctxMenu}>
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
  custom: '0 0 720 280',
}

const GOAL_WIDTHS = {
  mini: 60,
  small: 96,
  medium: 128,
  full: 192,
}

function PitchMarkings({ crop, goalWidth }) {
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
function PlayerDot({ cx, cy, team, label, name, interactive, onMouseDown, onContextMenu }) {
  const fillVar = team === 'red' ? 'var(--player-red)' : 'var(--player-blue)'
  return (
    <g
      style={{ cursor: interactive ? 'grab' : 'default' }}
      onMouseDown={interactive ? onMouseDown : undefined}
      onContextMenu={interactive ? onContextMenu : undefined}
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
function Arrow({ d, type, interactive, onContextMenu }) {
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
        />
      )}
    </>
  )
}

function Element({ el, interactive, onMouseDown, onContextMenu }) {
  if (el.type === 'zone') {
    return (
      <ellipse cx={el.cx} cy={el.cy} rx={el.rx ?? 40} ry={el.ry ?? 30}
        fill="rgba(240,165,0,0.06)" stroke={ARROW_MOVE}
        strokeWidth="1.2" strokeDasharray="6,4"
        onContextMenu={interactive ? onContextMenu : undefined}
      />
    )
  }
  if (el.type === 'ball') {
    return (
      <g
        style={{ cursor: interactive ? 'grab' : 'default' }}
        onMouseDown={interactive ? onMouseDown : undefined}
        onContextMenu={interactive ? onContextMenu : undefined}
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
  return (
    <foreignObject x={cx - 62} y={cy - 64} width="124" height="72">
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
  activeTool,
  arrowStart,
  previewLine,
  labelEditor,
  zoneDrawing,
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
}) {
  const svgRef = useRef(null)

  const safePlayers = Array.isArray(players) ? players : []
  const safeArrows = Array.isArray(arrows) ? arrows : []
  const safeElements = Array.isArray(elements) ? elements : []

  const resolvedCrop = (crop === 'custom') ? 'half' : crop
  const viewBox = VIEW_BOXES[resolvedCrop] ?? VIEW_BOXES.third
  const goalWidth = GOAL_WIDTHS[goalSize] ?? GOAL_WIDTHS.medium

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

  const interactiveProps = interactive ? {
    onClick: onSvgClick,
    onMouseDown: handleMouseDown,
    onMouseMove: onSvgMouseMove,
    onMouseUp: onSvgMouseUp,
    onMouseLeave: onSvgMouseUp,
  } : {}

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox}
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', cursor: interactive && activeTool ? 'crosshair' : 'default' }}
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

      <PitchMarkings crop={resolvedCrop} goalWidth={goalWidth} />

      {/* Zone elements render first (background layer) */}
      {safeElements
        .filter(el => el.type === 'zone-circle' || el.type === 'zone-rect')
        .map(el => (
          <ZoneShape
            key={el.id}
            zone={el}
            interactive={interactive}
            onContextMenu={onContextMenu}
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
    </svg>
  )
}

import { useState, useRef } from 'react'
import './PlanSidebar.css'

export default function PlanSidebar({ plan, teamName, drills, activeDrillId, onSelectDrill, onAddDrill, onDeleteDrill, onReorderDrills }) {
  const [confirmingId, setConfirmingId] = useState(null)
  const dragIndexRef = useRef(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  function handleDragStart(e, index) {
    dragIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e, index) {
    e.preventDefault()
    setDragOverIndex(index)
  }

  function handleDrop(e, toIndex) {
    e.preventDefault()
    const fromIndex = dragIndexRef.current
    dragIndexRef.current = null
    setDragOverIndex(null)
    if (fromIndex !== null && fromIndex !== toIndex) {
      onReorderDrills?.(fromIndex, toIndex)
    }
  }

  function handleDragEnd() {
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  return (
    <div className="plan-sidebar">
      <div className="sidebar-section-label" style={{ padding: '14px 16px 0', flexShrink: 0 }}>
        Drills&nbsp;({drills.length})
      </div>
      <div className="drill-list-section">
        {drills.map((drill, index) => (
            <div
              key={drill.id}
              className={[
                'drill-item-sb',
                drill.id === activeDrillId ? 'active' : '',
                dragOverIndex === index ? 'drag-over' : '',
              ].filter(Boolean).join(' ')}
              draggable
              onDragStart={e => handleDragStart(e, index)}
              onDragOver={e => handleDragOver(e, index)}
              onDrop={e => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => confirmingId !== drill.id && onSelectDrill?.(drill)}
            >
              {confirmingId === drill.id ? (
                <div className="dis-delete-confirm">
                  <span className="dis-confirm-text">Delete?</span>
                  <button
                    className="dis-confirm-btn dis-confirm-btn--yes"
                    onClick={e => {
                      e.stopPropagation()
                      setConfirmingId(null)
                      onDeleteDrill?.(drill)
                    }}
                  >
                    Yes
                  </button>
                  <button
                    className="dis-confirm-btn"
                    onClick={e => {
                      e.stopPropagation()
                      setConfirmingId(null)
                    }}
                  >
                    No
                  </button>
                </div>
              ) : (
                <>
                  <div className="dis-num">{drill.order}</div>
                  <div className="dis-body">
                    <div className="dis-name">{drill.title}</div>
                    <div className="dis-meta">
                      {drill.duration}
                      {drill.format && drill.format !== 'All players' && <>&nbsp;&middot;&nbsp;{drill.format}</>}
                    </div>
                  </div>
                  <button
                    className="dis-delete"
                    title="Delete drill"
                    onClick={e => {
                      e.stopPropagation()
                      setConfirmingId(drill.id)
                    }}
                  >
                    &times;
                  </button>
                  <span className="dis-drag">&#8597;</span>
                </>
              )}
            </div>
          ))}
        <button className="add-drill-btn" onClick={onAddDrill}>
          <span className="add-drill-icon">+</span> Add drill
        </button>
      </div>
    </div>
  )
}

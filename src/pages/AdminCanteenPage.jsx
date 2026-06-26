import { useState, useEffect } from 'react'
import TopNav from '../components/layout/TopNav'
import PageHeader from '../components/layout/PageHeader'
import useAdminCanteen from '../hooks/useAdminCanteen'
import { formatShiftTime } from '../hooks/useCanteenShifts'
import './AdminCanteenPage.css'

function todayISO() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' })
}

function fmtDateLong(isoDate) {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateShort(isoDate) {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

function fmtTime12(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  let h = d.getHours()
  const m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 === 0 ? 12 : h % 12
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`
}

function fmtTimeStr(timeStr) {
  if (!timeStr) return '—'
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

function relativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'Just now'
  if (mins < 60) return `${mins} mins ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return days === 1 ? '1 day ago' : `${days} days ago`
}

// ─────────────────────────────────────────────
// SHIFTS TAB
// ─────────────────────────────────────────────
function ShiftsTab({ shifts, createShift, updateShift, deleteShift, onNewShift, createMode, setCreateMode, canteenWorkers, assignWorker, unassignWorker }) {
  const [newFields, setNewFields] = useState({ title: '', shift_date: '', start_time: '', end_time: '' })
  const [editId, setEditId] = useState(null)
  const [editFields, setEditFields] = useState({})
  const [deleteId, setDeleteId] = useState(null)
  const [deleteError, setDeleteError] = useState({})
  const [saving, setSaving] = useState(false)
  const [assignOpenId, setAssignOpenId] = useState(null)

  const today = todayISO()
  const upcoming = shifts
    .filter(s => s.shift_date >= today)
    .sort((a, b) => a.shift_date.localeCompare(b.shift_date) || a.start_time.localeCompare(b.start_time))
  const past = shifts
    .filter(s => s.shift_date < today)
    .sort((a, b) => b.shift_date.localeCompare(a.shift_date) || a.start_time.localeCompare(b.start_time))

  function cancelCreate() {
    setCreateMode(false)
    setNewFields({ title: '', shift_date: '', start_time: '', end_time: '' })
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    await createShift(newFields)
    setSaving(false)
    cancelCreate()
  }

  function startEdit(shift) {
    setEditId(shift.id)
    setEditFields({ title: shift.title, shift_date: shift.shift_date, start_time: shift.start_time.slice(0, 5), end_time: shift.end_time.slice(0, 5) })
    setDeleteId(null)
  }

  async function handleSaveEdit(id) {
    setSaving(true)
    await updateShift(id, editFields)
    setSaving(false)
    setEditId(null)
  }

  async function handleDelete(id) {
    const { error } = await deleteShift(id)
    if (error) {
      setDeleteError(prev => ({ ...prev, [id]: error }))
      setDeleteId(null)
      setTimeout(() => setDeleteError(prev => { const n = { ...prev }; delete n[id]; return n }), 4000)
    } else {
      setDeleteId(null)
    }
  }

  function renderAssignRow(shift) {
    const assignedWorkers = shift.canteen_shift_assignments || []
    const assignedIds = new Set(assignedWorkers.map(a => a.worker_id))
    const available = (canteenWorkers || []).filter(w => !assignedIds.has(w.id))

    return (
      <tr key={shift.id + '-assign'}>
        <td colSpan={4} className="acp-assign-row">
          <span className="acp-assign-label">Assigned:</span>
          <span className="acp-assign-chips">
            {assignedWorkers.length === 0 ? (
              <span className="acp-assign-empty">No workers assigned</span>
            ) : (
              assignedWorkers.map(a => (
                <span key={a.worker_id} className="acp-assign-chip">
                  {a.profiles?.name}
                  <button
                    className="acp-assign-remove"
                    onClick={() => unassignWorker(shift.id, a.worker_id)}
                  >×</button>
                </span>
              ))
            )}
            {assignOpenId === shift.id ? (
              available.length === 0 ? (
                <span className="acp-assign-all-assigned">All workers assigned</span>
              ) : (
                <select
                  className="acp-assign-select"
                  autoFocus
                  defaultValue=""
                  onChange={e => {
                    if (e.target.value) {
                      assignWorker(shift.id, e.target.value)
                      setAssignOpenId(null)
                    }
                  }}
                  onBlur={() => setAssignOpenId(null)}
                >
                  <option value="" disabled>Select worker…</option>
                  {available.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              )
            ) : (
              <button
                className="acp-assign-btn"
                onClick={() => setAssignOpenId(shift.id)}
              >+ Assign</button>
            )}
          </span>
        </td>
      </tr>
    )
  }

  function renderRow(shift) {
    const isEditing = editId === shift.id
    const isDeleting = deleteId === shift.id
    const errMsg = deleteError[shift.id]

    if (isEditing) {
      return (
        <>
          <tr key={shift.id}>
            <td><input className="acp-input" type="date" value={editFields.shift_date} onChange={e => setEditFields(f => ({ ...f, shift_date: e.target.value }))} /></td>
            <td><input className="acp-input" type="text" value={editFields.title} onChange={e => setEditFields(f => ({ ...f, title: e.target.value }))} /></td>
            <td>
              <input className="acp-input acp-input--sm" type="time" value={editFields.start_time} onChange={e => setEditFields(f => ({ ...f, start_time: e.target.value }))} />
              {' – '}
              <input className="acp-input acp-input--sm" type="time" value={editFields.end_time} onChange={e => setEditFields(f => ({ ...f, end_time: e.target.value }))} />
            </td>
            <td className="acp-actions">
              <button className="acp-act-link acp-act-link--gold" onClick={() => handleSaveEdit(shift.id)} disabled={saving}>Save</button>
              <button className="acp-act-link" onClick={() => setEditId(null)}>Cancel</button>
            </td>
          </tr>
          {renderAssignRow(shift)}
        </>
      )
    }

    return (
      <>
        <tr key={shift.id}>
          <td>{fmtDateLong(shift.shift_date)}</td>
          <td>{shift.title}</td>
          <td>{formatShiftTime(shift.start_time, shift.end_time)}</td>
          <td className="acp-actions">
            {isDeleting ? (
              <>
                <span className="acp-confirm-label">Confirm?</span>
                <button className="acp-act-link acp-act-link--err" onClick={() => handleDelete(shift.id)}>Yes, delete</button>
                <button className="acp-act-link" onClick={() => setDeleteId(null)}>Cancel</button>
              </>
            ) : (
              <>
                <button className="acp-act-link acp-act-link--gold" onClick={() => startEdit(shift)}>Edit</button>
                <button className="acp-act-link acp-act-link--gold" onClick={() => { setDeleteId(shift.id); setEditId(null) }}>Delete</button>
              </>
            )}
          </td>
        </tr>
        {errMsg && (
          <tr key={shift.id + '-err'}>
            <td colSpan={4} className="acp-row-err">{errMsg}</td>
          </tr>
        )}
        {renderAssignRow(shift)}
      </>
    )
  }

  return (
    <div className="acp-tab-body">
      {createMode && (
        <form className="acp-create-form" onSubmit={handleCreate}>
          <div className="acp-form-fields">
            <div className="acp-field">
              <label className="acp-field-label">Title</label>
              <input className="acp-input" type="text" required value={newFields.title} onChange={e => setNewFields(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="acp-field">
              <label className="acp-field-label">Date</label>
              <input className="acp-input" type="date" required value={newFields.shift_date} onChange={e => setNewFields(f => ({ ...f, shift_date: e.target.value }))} />
            </div>
            <div className="acp-field">
              <label className="acp-field-label">Start time</label>
              <input className="acp-input" type="time" required value={newFields.start_time} onChange={e => setNewFields(f => ({ ...f, start_time: e.target.value }))} />
            </div>
            <div className="acp-field">
              <label className="acp-field-label">End time</label>
              <input className="acp-input" type="time" required value={newFields.end_time} onChange={e => setNewFields(f => ({ ...f, end_time: e.target.value }))} />
            </div>
          </div>
          <div className="acp-form-actions">
            <button type="submit" className="primary-btn" disabled={saving}>Save Shift</button>
            <button type="button" className="acp-cancel-link" onClick={cancelCreate}>Cancel</button>
          </div>
        </form>
      )}

      {upcoming.length > 0 && (
        <>
          <span className="acp-section-head">Upcoming</span>
          <table className="acp-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{upcoming.map(renderRow)}</tbody>
          </table>
        </>
      )}

      {past.length > 0 && (
        <>
          <span className="acp-section-head">Past</span>
          <table className="acp-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{past.map(renderRow)}</tbody>
          </table>
        </>
      )}

      {shifts.length === 0 && !createMode && (
        <p className="acp-empty">No shifts yet. Use &ldquo;+ New Shift&rdquo; to add one.</p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// APPROVALS TAB
// ─────────────────────────────────────────────
function ApprovalsTab({ pendingApprovals, approveEvent, rejectEvent }) {
  const [busy, setBusy] = useState(null)

  async function handleApprove(id) {
    setBusy(id)
    await approveEvent(id)
    setBusy(null)
  }

  async function handleReject(id) {
    setBusy(id)
    await rejectEvent(id)
    setBusy(null)
  }

  if (pendingApprovals.length === 0) {
    return <p className="acp-empty acp-empty--centre">No approvals pending.</p>
  }

  return (
    <div className="acp-tab-body">
      {pendingApprovals.map(ev => {
        const reasonParts = []
        if (ev.early_in && ev.late_out) reasonParts.push('Early in + Late out')
        else if (ev.early_in) reasonParts.push('Early clock-in')
        else if (ev.late_out) reasonParts.push('Late clock-out')

        return (
          <div key={ev.id} className="acp-approval-row">
            <div className="acp-approval-top">
              <span className="acp-worker-name">{ev.worker?.name ?? '—'}</span>
              {reasonParts.map(r => (
                <span key={r} className="acp-badge acp-badge--warn">{r}</span>
              ))}
            </div>
            <p className="acp-approval-shift">
              {ev.shift?.title} &middot; {fmtDateShort(ev.shift?.shift_date)}
            </p>
            <div className="acp-approval-times">
              {ev.early_in && (
                <p>Clocked in: {fmtTime12(ev.clocked_in_at)} &middot; Shift starts: {fmtTimeStr(ev.shift?.start_time)}</p>
              )}
              {ev.late_out && (
                <p>Clocked out: {fmtTime12(ev.clocked_out_at)} &middot; Shift ends: {fmtTimeStr(ev.shift?.end_time)}</p>
              )}
            </div>
            <div className="acp-approval-actions">
              <button className="primary-btn acp-action-btn" onClick={() => handleApprove(ev.id)} disabled={busy === ev.id}>Approve</button>
              <button className="secondary-btn acp-action-btn" onClick={() => handleReject(ev.id)} disabled={busy === ev.id}>Reject</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// HISTORY TAB
// ─────────────────────────────────────────────
function HistoryTab({ clockHistory }) {
  if (clockHistory.length === 0) {
    return <p className="acp-empty acp-empty--centre">No clock history yet.</p>
  }

  function statusPill(status) {
    if (status === 'approved') return <span className="acp-pill acp-pill--ok">Approved</span>
    if (status === 'rejected') return <span className="acp-pill acp-pill--err">Rejected</span>
    return <span className="acp-pill acp-pill--ok">On Time</span>
  }

  return (
    <div className="acp-tab-body">
      <table className="acp-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Worker</th>
            <th>Shift</th>
            <th>Clocked In</th>
            <th>Clocked Out</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {clockHistory.map(ev => (
            <tr key={ev.id}>
              <td>{fmtDateShort(ev.shift?.shift_date)}</td>
              <td>{ev.worker?.name ?? '—'}</td>
              <td>{ev.shift?.title ?? '—'}</td>
              <td>{fmtTime12(ev.clocked_in_at)}</td>
              <td>{fmtTime12(ev.clocked_out_at)}</td>
              <td>{statusPill(ev.approval_status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────
// WISH LIST TAB
// ─────────────────────────────────────────────
function WishlistTab({ wishlist, updateWishStatus, addItem }) {
  const [inputVal, setInputVal] = useState('')
  const [busy, setBusy] = useState(null)

  async function handleToggle(item) {
    if (busy === item.id) return
    setBusy(item.id)
    const next = item.status === 'got_it' ? 'requested' : 'got_it'
    await updateWishStatus(item.id, next)
    setBusy(null)
  }

  async function handleAdd(e) {
    e.preventDefault()
    const content = inputVal.trim()
    if (!content) return
    await addItem(content)
    setInputVal('')
  }

  function pillProps(status) {
    if (status === 'got_it') return { label: 'Got It', cls: 'acp-pill acp-pill--ok' }
    return { label: 'Requested', cls: 'acp-pill acp-pill--warn' }
  }

  return (
    <div className="acp-tab-body">
      <div className="acp-wish-list">
        {wishlist.length === 0 && (
          <p className="acp-empty">No wish list items yet.</p>
        )}
        {wishlist.map(item => {
          const { label, cls } = pillProps(item.status)
          return (
            <div key={item.id} className="acp-wish-row">
              <p className="acp-wish-text">{item.content}</p>
              <div className="acp-wish-meta">
                <span className="acp-wish-meta-text">
                  {item.added_by_profile?.name ?? 'Unknown'} &middot; {relativeTime(item.created_at)}
                </span>
                <span
                  className={`${cls} acp-pill--tappable`}
                  onClick={() => handleToggle(item)}
                  style={{ cursor: busy === item.id ? 'wait' : 'pointer' }}
                >
                  {label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="acp-wish-add">
        <form onSubmit={handleAdd}>
          <input
            className="acp-wish-input"
            type="text"
            placeholder="Add something the canteen needs…"
            maxLength={140}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
          />
          <button
            type="submit"
            className="primary-btn"
            disabled={!inputVal.trim()}
          >
            Add to Wish List
          </button>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function AdminCanteenPage() {
  const {
    shifts, pendingApprovals, clockHistory, wishlist, canteenWorkers,
    loading, refetch,
    createShift, updateShift, deleteShift,
    approveEvent, rejectEvent,
    assignWorker, unassignWorker,
    updateWishStatus, addItem,
  } = useAdminCanteen()

  const [activeTab, setActiveTab] = useState('shifts')
  const [createMode, setCreateMode] = useState(false)

  const tabs = [
    { id: 'shifts', label: 'Shifts' },
    { id: 'approvals', label: 'Approvals', count: pendingApprovals.length },
    { id: 'history', label: 'History' },
    { id: 'wishlist', label: 'Wish List' },
  ]

  return (
    <>
      <TopNav />
      <PageHeader
        title="Canteen"
        subtitle="Manage shifts, review approvals, and track clock history."
        action={
          activeTab === 'shifts' && !createMode
            ? <button className="primary-btn" onClick={() => setCreateMode(true)}>+ New Shift</button>
            : null
        }
      />

      <div className="acp-tab-bar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`acp-tab-btn${activeTab === tab.id ? ' acp-tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count > 0 && <span className="acp-tab-count">{tab.count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="acp-empty">Loading…</p>
      ) : (
        <>
          {activeTab === 'shifts' && (
            <ShiftsTab
              shifts={shifts}
              createShift={createShift}
              updateShift={updateShift}
              deleteShift={deleteShift}
              createMode={createMode}
              setCreateMode={setCreateMode}
              canteenWorkers={canteenWorkers}
              assignWorker={assignWorker}
              unassignWorker={unassignWorker}
            />
          )}
          {activeTab === 'approvals' && (
            <ApprovalsTab
              pendingApprovals={pendingApprovals}
              approveEvent={approveEvent}
              rejectEvent={rejectEvent}
            />
          )}
          {activeTab === 'history' && (
            <HistoryTab clockHistory={clockHistory} />
          )}
          {activeTab === 'wishlist' && (
            <WishlistTab
              wishlist={wishlist}
              updateWishStatus={updateWishStatus}
              addItem={addItem}
            />
          )}
        </>
      )}
    </>
  )
}

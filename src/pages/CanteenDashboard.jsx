import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useCanteenShifts, { formatShiftTime } from '../hooks/useCanteenShifts'
import useCanteenClock from '../hooks/useCanteenClock'
import useCanteenWishlist from '../hooks/useCanteenWishlist'
import './CanteenDashboard.css'

function todayISO() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function fmtDate(isoDate) {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

function fmtTime12(isoString) {
  const d = new Date(isoString)
  let h = d.getHours()
  const m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 === 0 ? 12 : h % 12
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`
}

function daysUntil(isoDate) {
  const today = new Date(todayISO() + 'T00:00:00')
  const target = new Date(isoDate + 'T00:00:00')
  const diff = Math.round((target - today) / 86400000)
  if (diff === 1) return 'tomorrow'
  if (diff === 0) return 'today'
  return `in ${diff} days`
}

function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function clockPillProps(clockEvent) {
  if (!clockEvent) return { label: 'Not Clocked In', cls: 'cd-pill cd-pill--warn' }
  if (clockEvent.clocked_in_at && !clockEvent.clocked_out_at) return { label: 'Clocked In', cls: 'cd-pill cd-pill--ok' }
  const status = clockEvent.approval_status
  if (status === 'pending') return { label: 'Pending Approval', cls: 'cd-pill cd-pill--warn' }
  if (status === 'approved') return { label: 'Approved', cls: 'cd-pill cd-pill--ok' }
  if (status === 'rejected') return { label: 'Rejected', cls: 'cd-pill cd-pill--err' }
  return { label: 'Complete', cls: 'cd-pill cd-pill--ok' }
}

function relativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'Just now'
  if (mins < 60) return `${mins} mins ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function TodayBlock({ todayShift, clockEvent, onClockIn, onClockOut }) {
  const [elapsed, setElapsed] = useState('')
  const intervalRef = useRef(null)

  const clocking = clockEvent?.clocked_in_at && !clockEvent?.clocked_out_at

  useEffect(() => {
    if (clocking) {
      function tick() {
        setElapsed(formatElapsed(Date.now() - new Date(clockEvent.clocked_in_at).getTime()))
      }
      tick()
      intervalRef.current = setInterval(tick, 1000)
    } else {
      clearInterval(intervalRef.current)
      setElapsed('')
    }
    return () => clearInterval(intervalRef.current)
  }, [clocking, clockEvent?.clocked_in_at])

  const noShift = !todayShift
  const pill = clockPillProps(clockEvent)

  const showClockIn = !clockEvent || !clockEvent.clocked_in_at
  const showClockOut = clockEvent?.clocked_in_at && !clockEvent?.clocked_out_at
  const showButton = showClockIn || showClockOut

  const clockInDisabled = noShift || (clockEvent && clockEvent.clocked_in_at)
  const clockOutDisabled = !clockEvent?.clocked_in_at

  return (
    <div className="cd-today">
      {noShift ? (
        <>
          <p className="cd-eyebrow">Today&rsquo;s Shift &middot; {fmtDate(todayISO())}</p>
          <p className="cd-no-shift">No shift scheduled today.</p>
          <button
            className="cd-clock-btn"
            disabled
            style={{ opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' }}
          >
            Clock In
          </button>
        </>
      ) : (
        <>
          <p className="cd-eyebrow">Today&rsquo;s Shift &middot; {fmtDate(todayShift.shift_date)}</p>
          <p className="cd-shift-time">{formatShiftTime(todayShift.start_time, todayShift.end_time)}</p>
          <p className="cd-shift-name">{todayShift.title}</p>

          <div className="cd-status-row">
            <span className={pill.cls}>{pill.label}</span>
          </div>

          {showButton && (
            <button
              className={`cd-clock-btn${showClockOut ? ' cd-clock-btn--out' : ''}`}
              disabled={showClockIn ? clockInDisabled : clockOutDisabled}
              style={(showClockIn ? clockInDisabled : clockOutDisabled)
                ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' }
                : {}}
              onClick={showClockIn
                ? () => onClockIn(todayShift)
                : () => onClockOut(clockEvent.id, todayShift)}
            >
              {showClockIn ? 'Clock In' : 'Clock Out'}
            </button>
          )}

          {clocking && elapsed && (
            <p className="cd-clock-meta">
              Clocked in at {fmtTime12(clockEvent.clocked_in_at)} &middot; {elapsed} on shift
            </p>
          )}

          {clockEvent?.approval_status === 'pending' && (
            <p className="cd-pending-note">
              Your hours are outside the standard shift window and need admin approval.
            </p>
          )}
        </>
      )}
    </div>
  )
}

function ScheduleTab({ shifts }) {
  const today = todayISO()
  const todayShift = shifts.find(s => s.shift_date === today) ?? null
  const { clockEvent, clockIn, clockOut } = useCanteenClock(todayShift?.id ?? null)

  async function handleClockIn(shift) { await clockIn(shift) }
  async function handleClockOut(eventId, shift) { await clockOut(eventId, shift) }

  const upcoming = shifts.filter(s => s.shift_date > today)

  const now = new Date()
  const plus14 = new Date(now)
  plus14.setDate(plus14.getDate() + 14)

  return (
    <>
      <TodayBlock
        todayShift={todayShift}
        clockEvent={clockEvent}
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
      />

      <div className="cd-section">
        <span className="cd-section-head">Upcoming Shifts</span>
        {upcoming.length === 0 && (
          <p className="cd-faint" style={{ fontSize: '13px', padding: '12px 0' }}>
            No upcoming shifts in the next two weeks.
          </p>
        )}
        {upcoming.map(shift => (
          <div key={shift.id} className="cd-shift-row">
            <div>
              <p className="cd-shift-date">{fmtDate(shift.shift_date)}</p>
              <p className="cd-shift-desc">{shift.title}</p>
            </div>
            <div className="cd-shift-right">
              <p className="cd-shift-clock">{formatShiftTime(shift.start_time, shift.end_time)}</p>
              <p className="cd-shift-countdown">{daysUntil(shift.shift_date)}</p>
            </div>
          </div>
        ))}
        <p className="cd-fortnight-note">Shifts are published up to two weeks ahead. Check back for new dates.</p>
      </div>
    </>
  )
}

function WishlistTab({ role }) {
  const { items, loading, addItem } = useCanteenWishlist()
  const [inputVal, setInputVal] = useState('')

  async function handleAdd(e) {
    e.preventDefault()
    const content = inputVal.trim()
    if (!content) return
    await addItem(content)
    setInputVal('')
  }

  function pillProps(status) {
    if (status === 'got_it') return { label: 'Got It', cls: 'cd-pill cd-pill--ok' }
    return { label: 'Requested', cls: 'cd-pill cd-pill--warn' }
  }

  const canTap = role === 'admin' || role === 'president'

  return (
    <>
      <div className="cd-section">
        <span className="cd-section-head">Wish List</span>
        <p className="cd-section-note">
          Notes and items the canteen needs — stock, equipment, repairs. Reviewed weekly.
          {canTap && ' Tap a tag to mark it sorted.'}
        </p>
      </div>

      <div className="cd-section" style={{ paddingTop: 0 }}>
        {loading && <p className="cd-faint">Loading…</p>}
        {items.map(item => {
          const { label, cls } = pillProps(item.status)
          return (
            <div key={item.id} className="cd-wish-row">
              <p className="cd-wish-text">{item.content}</p>
              <div className="cd-wish-meta">
                <span className="cd-wish-meta-text">
                  {item.added_by_profile?.name ?? 'Unknown'} &middot; {relativeTime(item.created_at)}
                </span>
                <span
                  className={`${cls}${canTap ? ' cd-pill--tappable' : ''}`}
                  style={canTap ? { cursor: 'pointer' } : { cursor: 'default' }}
                >
                  {label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="cd-wish-add">
        <form onSubmit={handleAdd}>
          <input
            className="cd-wish-input"
            type="text"
            placeholder="Add something the canteen needs…"
            maxLength={140}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
          />
          <button
            type="submit"
            className="cd-clock-btn"
            disabled={!inputVal.trim()}
            style={!inputVal.trim() ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
          >
            Add to Wish List
          </button>
        </form>
      </div>
    </>
  )
}

export default function CanteenDashboard() {
  const { role } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'schedule'
  const { shifts, loading } = useCanteenShifts()

  function setTab(t) {
    setSearchParams({ tab: t })
  }

  const today = todayISO()
  const plus14 = new Date()
  plus14.setDate(plus14.getDate() + 14)
  const headerSub = tab === 'schedule'
    ? `${fmtDate(today)} – ${fmtDate(plus14.toISOString().slice(0, 10))} · published 2 weeks ahead`
    : 'Notes & items for the canteen'
  const headerTitle = tab === 'schedule' ? 'My Shifts' : 'Wish List'

  return (
    <main className="cd-main">
      <nav className="cd-tab-nav">
        <button
          className={`cd-tab-link${tab === 'schedule' ? ' cd-tab-link--active' : ''}`}
          onClick={() => setTab('schedule')}
        >
          Schedule
        </button>
        <button
          className={`cd-tab-link${tab === 'wishlist' ? ' cd-tab-link--active' : ''}`}
          onClick={() => setTab('wishlist')}
        >
          Wish List
        </button>
      </nav>

      <div className="cd-page-head">
        <h1 className="cd-page-title">{headerTitle}</h1>
        <p className="cd-page-sub">{headerSub}</p>
      </div>

      {tab === 'schedule' && (
        loading
          ? <p className="cd-faint" style={{ padding: '20px' }}>Loading shifts…</p>
          : <ScheduleTab shifts={shifts} />
      )}
      {tab === 'wishlist' && <WishlistTab role={role} />}

      <div className="cd-footer">
        <span>Bribie Tigers FC</span>
        <span>Canteen Portal</span>
      </div>
    </main>
  )
}

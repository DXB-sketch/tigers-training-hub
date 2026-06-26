import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import supabase from '../lib/supabase'

function timeToDateToday(timeStr) {
  const todayBrisbane = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' })
  return new Date(`${todayBrisbane}T${timeStr}`)
}

export default function useCanteenClock(shiftId) {
  const { user } = useAuth()
  const [clockEvent, setClockEvent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!shiftId || !user) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from('canteen_clock_events')
      .select('*')
      .eq('shift_id', shiftId)
      .eq('worker_id', user.id)
      .maybeSingle()
    if (err) setError(err.message)
    else setClockEvent(data ?? null)
    setLoading(false)
  }, [shiftId, user])

  useEffect(() => {
    if (!shiftId) {
      setClockEvent(null)
      setLoading(false)
      setError(null)
      return
    }
    refetch()
  }, [shiftId, refetch])

  async function clockIn(shift) {
    const now = new Date()
    const shiftStart = timeToDateToday(shift.start_time)
    const minutesEarly = (shiftStart - now) / 60000
    const early_in = minutesEarly > 30
    const approval_status = early_in ? 'pending' : 'none'

    const { error: err } = await supabase
      .from('canteen_clock_events')
      .insert({
        shift_id: shift.id,
        worker_id: user.id,
        clocked_in_at: now.toISOString(),
        early_in,
        approval_status,
      })
    await refetch()
    return { error: err }
  }

  async function clockOut(eventId, shift) {
    const now = new Date()
    const shiftEnd = timeToDateToday(shift.end_time)
    const minutesLate = (now - shiftEnd) / 60000
    const late_out = minutesLate > 30

    let approval_status = clockEvent?.approval_status ?? 'none'
    if (late_out) {
      if (approval_status !== 'pending') approval_status = 'pending'
    }

    const { error: err } = await supabase
      .from('canteen_clock_events')
      .update({ clocked_out_at: now.toISOString(), late_out, approval_status })
      .eq('id', eventId)
    await refetch()
    return { error: err }
  }

  return { clockEvent, loading, error, refetch, clockIn, clockOut }
}

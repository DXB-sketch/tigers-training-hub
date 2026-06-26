import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import supabase from '../lib/supabase'

export function formatShiftTime(start_time, end_time) {
  function fmt(t) {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 === 0 ? 12 : h % 12
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
  }
  return `${fmt(start_time)} – ${fmt(end_time)}`
}

export default function useCanteenShifts() {
  const { user } = useAuth()
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    async function fetch() {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' })
      const d = new Date()
      d.setDate(d.getDate() + 14)
      const plus14days = d.toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' })

      const { data, error: err } = await supabase
        .from('canteen_shifts')
        .select(`
          *,
          canteen_shift_assignments!inner(worker_id)
        `)
        .eq('canteen_shift_assignments.worker_id', user.id)
        .gte('shift_date', today)
        .lte('shift_date', plus14days)
        .order('shift_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (err) setError(err.message)
      else setShifts(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [user])

  return { shifts, loading, error }
}

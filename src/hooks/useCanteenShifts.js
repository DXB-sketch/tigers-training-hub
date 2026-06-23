import { useState, useEffect } from 'react'
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

function toISODate(date) {
  return date.toISOString().slice(0, 10)
}

export default function useCanteenShifts() {
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetch() {
      const today = new Date()
      const plus14 = new Date(today)
      plus14.setDate(plus14.getDate() + 14)

      const { data, error: err } = await supabase
        .from('canteen_shifts')
        .select('*')
        .gte('shift_date', toISODate(today))
        .lte('shift_date', toISODate(plus14))
        .order('shift_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (err) setError(err.message)
      else setShifts(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  return { shifts, loading, error }
}

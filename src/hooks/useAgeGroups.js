import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

export function useAgeGroups() {
  const [ageGroups, setAgeGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('age_groups')
        .select('*')
        .order('sort_order', { ascending: true })
      if (cancelled) return
      if (err) setError(err.message)
      else setAgeGroups(data ?? [])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [tick])

  return { ageGroups, loading, error, refetch: () => setTick(t => t + 1) }
}

import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

function transformPlan(p) {
  return {
    id: p.id,
    teamId: p.team_id,
    teamName: p.teams?.name ?? '',
    weekNumber: p.week_number,
    title: p.title,
    status: p.status,
    durationMinutes: p.duration_minutes,
    drillCount: p.drills?.[0]?.count ?? 0,
    createdAt: p.created_at ? p.created_at.slice(0, 10) : '',
  }
}

export function usePlans(filters = {}) {
  const [plans, setPlans]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [tick, setTick]       = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      let query = supabase
        .from('plans')
        .select('*, teams(name), drills(count)')
        .is('deleted_at', null)
        .order('week_number', { ascending: false })
        .order('created_at', { ascending: false })

      if (filters.teamId)     query = query.eq('team_id', filters.teamId)
      if (filters.weekNumber) query = query.eq('week_number', filters.weekNumber)
      if (filters.status)     query = query.eq('status', filters.status)

      const { data, error: err } = await query
      if (cancelled) return
      if (err) {
        setError(err.message)
      } else {
        setPlans((data ?? []).map(transformPlan))
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [filters.teamId, filters.weekNumber, filters.status, tick])

  function refetch() { setTick(t => t + 1) }

  return { plans, loading, error, refetch }
}

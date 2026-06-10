import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

export function useCoachAssignments() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('coach_assignments')
        .select(`
          id,
          is_primary,
          profiles:coach_id ( id, name, email, phone_number ),
          teams:team_id ( id, name, age_groups:age_group_id ( name, sort_order ) )
        `)
      if (cancelled) return
      if (err) {
        setError(err.message)
      } else {
        const flat = (data ?? []).map(row => ({
          id: row.id,
          is_primary: row.is_primary,
          coach_id: row.profiles?.id ?? null,
          coach_name: row.profiles?.name ?? '',
          coach_email: row.profiles?.email ?? '',
          phone_number: row.profiles?.phone_number ?? null,
          team_id: row.teams?.id ?? null,
          team_name: row.teams?.name ?? '',
          age_group_name: row.teams?.age_groups?.name ?? '',
          sort_order: row.teams?.age_groups?.sort_order ?? 9999,
        }))
        flat.sort((a, b) =>
          a.sort_order - b.sort_order ||
          a.team_name.localeCompare(b.team_name) ||
          a.coach_name.localeCompare(b.coach_name)
        )
        setError(null)
        setAssignments(flat)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [tick])

  return { assignments, loading, error, refetch: () => setTick(t => t + 1) }
}

import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

function transformTeam(t) {
  const primaryAssignment = t.coach_assignments?.find(a => a.is_primary)
  const coach = primaryAssignment?.profiles
  const latestPlan = t.plans?.slice().sort((a, b) => b.week_number - a.week_number)[0]
  return {
    id: t.id,
    name: t.name,
    age_group_name: t.age_groups?.name ?? '',
    trainingDay: t.training_day,
    trainingTime: t.training_time,
    playerCount: t.player_count,
    coachId: primaryAssignment?.coach_id ?? null,
    coachName: coach?.name ?? null,
    coachEmail: coach?.email ?? null,
    currentPlanId: latestPlan?.id ?? null,
    currentPlanTitle: latestPlan?.title ?? null,
    currentPlanStatus: latestPlan?.status ?? null,
    currentPlanWeek: latestPlan?.week_number ?? null,
  }
}

export function useTeams() {
  const [teams, setTeams]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('teams')
        .select(`
          *,
          age_groups(name),
          coach_assignments(coach_id, is_primary, profiles(name, email)),
          plans(id, title, status, week_number)
        `)
        .order('name')
      if (cancelled) return
      if (err) {
        setError(err.message)
      } else {
        setTeams((data ?? []).map(transformTeam))
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { teams, loading, error }
}

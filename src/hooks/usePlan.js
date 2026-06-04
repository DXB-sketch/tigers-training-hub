import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

export function usePlan(planId) {
  const [plan, setPlan]   = useState(null)
  const [team, setTeam]   = useState(null)
  const [coach, setCoach] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!planId) { setLoading(false); return }
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data: planData, error: planErr } = await supabase
        .from('plans')
        .select('*, teams(*)')
        .eq('id', planId)
        .single()
      if (cancelled) return
      if (planErr) { setError(planErr.message); setLoading(false); return }

      const { data: assignment } = await supabase
        .from('coach_assignments')
        .select('profiles(name)')
        .eq('team_id', planData.team_id)
        .eq('is_primary', true)
        .maybeSingle()
      if (cancelled) return

      setPlan({
        id: planData.id,
        title: planData.title,
        weekNumber: planData.week_number,
        status: planData.status,
        durationMinutes: planData.duration_minutes,
        teamId: planData.team_id,
      })
      setTeam(planData.teams ? {
        id: planData.teams.id,
        name: planData.teams.name,
        trainingDay: planData.teams.training_day,
        trainingTime: planData.teams.training_time,
      } : null)
      setCoach({ name: assignment?.profiles?.name ?? 'Unknown' })
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [planId])

  return { plan, team, coach, loading, error }
}

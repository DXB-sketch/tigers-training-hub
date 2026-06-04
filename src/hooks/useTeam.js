import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

export function useTeam(teamId) {
  const [team, setTeam]       = useState(null)
  const [coach, setCoach]     = useState(null)
  const [currentPlan, setCurrentPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!teamId) { setLoading(false); return }
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('teams')
        .select(`
          *,
          coach_assignments(coach_id, is_primary, profiles(id, name, email)),
          plans(id, title, status, week_number, duration_minutes)
        `)
        .eq('id', teamId)
        .single()
      if (cancelled) return
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      const primaryAssignment = data.coach_assignments?.find(a => a.is_primary)
      const coachProfile = primaryAssignment?.profiles
      const latestPlan = data.plans?.slice().sort((a, b) => b.week_number - a.week_number)[0]

      setTeam({
        id: data.id,
        name: data.name,
        ageGroup: data.age_group,
        trainingDay: data.training_day,
        trainingTime: data.training_time,
        playerCount: data.player_count,
      })
      setCoach(coachProfile ? {
        id: coachProfile.id,
        name: coachProfile.name,
        email: coachProfile.email,
      } : null)
      setCurrentPlan(latestPlan ? {
        id: latestPlan.id,
        title: latestPlan.title,
        weekNumber: latestPlan.week_number,
        status: latestPlan.status,
        durationMinutes: latestPlan.duration_minutes,
      } : null)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [teamId])

  return { team, coach, currentPlan, loading, error }
}

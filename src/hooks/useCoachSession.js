import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'
import { transformDrill } from './useDrills'

export function useCoachSession(coachId) {
  const [team, setTeam]   = useState(null)
  const [plan, setPlan]   = useState(null)
  const [drills, setDrills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!coachId) { setLoading(false); return }
    let cancelled = false
    async function load() {
      setLoading(true)
      // Step 1: get coach's primary team assignment
      const { data: assignment, error: assignErr } = await supabase
        .from('coach_assignments')
        .select('team_id, teams(id, name, training_day, training_time)')
        .eq('coach_id', coachId)
        .eq('is_primary', true)
        .maybeSingle()
      if (cancelled) return
      if (assignErr) { setError(assignErr.message); setLoading(false); return }
      if (!assignment) { setLoading(false); return }

      const teamData = assignment.teams
      setTeam({
        id: teamData.id,
        name: teamData.name,
        trainingDay: teamData.training_day,
        trainingTime: teamData.training_time,
      })

      // Step 2: get most recent published plan for this team
      const { data: planData, error: planErr } = await supabase
        .from('plans')
        .select('id, title, week_number, status, duration_minutes')
        .eq('team_id', assignment.team_id)
        .eq('status', 'published')
        .order('week_number', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (cancelled) return
      if (planErr) { setError(planErr.message); setLoading(false); return }
      if (!planData) { setLoading(false); return }

      setPlan({
        id: planData.id,
        title: planData.title,
        weekNumber: planData.week_number,
        status: planData.status,
        durationMinutes: planData.duration_minutes,
      })

      // Step 3: get drills for this plan
      const { data: drillData, error: drillErr } = await supabase
        .from('drills')
        .select('*')
        .eq('plan_id', planData.id)
        .order('drill_order')
      if (cancelled) return
      if (drillErr) { setError(drillErr.message); setLoading(false); return }

      setDrills((drillData ?? []).map(transformDrill))
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [coachId])

  return { team, plan, drills, loading, error }
}

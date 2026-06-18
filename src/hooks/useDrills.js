import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

function safeParseArray(value) {
  if (Array.isArray(value)) return value
  if (value === null || value === undefined) return []
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  }
  if (typeof value === 'object') {
    return Array.isArray(value) ? value : []
  }
  return []
}

export function transformDrill(d) {
  return {
    id: d.id,
    planId: d.plan_id,
    order: d.drill_order,
    category: d.category,
    title: d.title,
    subtitle: d.subtitle,
    duration: d.duration,
    format: d.format,
    intensity: d.intensity,
    description: d.description ? d.description.split('\n').filter(Boolean) : [],
    setup: d.setup ? d.setup.split('\n').filter(Boolean) : [],
    organisation: (() => {
      if (!d.organisation) return {}
      try { return JSON.parse(d.organisation) } catch { return {} }
    })(),
    progressions: d.progressions ? d.progressions.split('\n').filter(Boolean) : [],
    coachingPoints: d.coaching_points ? d.coaching_points.split('\n').filter(Boolean) : [],
    pitchCrop: d.pitch_crop ?? 'third',
    goalSize: d.goal_size ?? 'medium',
    players: safeParseArray(d.players),
    arrows: safeParseArray(d.arrows),
    elements: safeParseArray(d.elements),
  }
}

export function useDrills(planId) {
  const [drills, setDrills]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!planId) { setLoading(false); return }
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('drills')
        .select('*')
        .eq('plan_id', planId)
        .order('drill_order', { ascending: true })
      if (cancelled) return
      if (err) {
        setError(err.message)
      } else {
        setDrills((data ?? []).map(transformDrill))
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [planId])

  return { drills, loading, error }
}

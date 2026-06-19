import { useState, useEffect } from 'react'
import TopNav from '../components/layout/TopNav'
import PageHeader from '../components/layout/PageHeader'
import CoachDetailPanel from '../components/admin/CoachDetailPanel'
import { useCoachAssignments } from '../hooks/useCoachAssignments'
import { useTeams } from '../hooks/useTeams'
import { useAuth } from '../context/AuthContext'
import supabase from '../lib/supabase'
import './CoachesPage.css'

export default function CoachesPage() {
  const { role } = useAuth()
  const { assignments, loading, error, refetch } = useCoachAssignments()
  const { teams } = useTeams()
  const [allCoaches, setAllCoaches] = useState([])
  const [selectedCoachId, setSelectedCoachId] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email, phone_number')
        .eq('role', 'coach')
      if (!cancelled) setAllCoaches(data ?? [])
    }
    load()
    return () => { cancelled = true }
  }, [])

  const term = search.trim().toLowerCase()
  function matches(name, email) {
    if (!term) return true
    return (name ?? '').toLowerCase().includes(term) || (email ?? '').toLowerCase().includes(term)
  }

  const filteredAssignments = assignments.filter(a => matches(a.coach_name, a.coach_email))

  // Group filtered assignments: age group -> team -> coaches (input is pre-sorted)
  const groups = []
  const ageIndex = new Map()
  for (const a of filteredAssignments) {
    const agName = a.age_group_name || 'No age group'
    if (!ageIndex.has(agName)) {
      ageIndex.set(agName, { name: agName, teams: [], teamIndex: new Map() })
      groups.push(ageIndex.get(agName))
    }
    const ag = ageIndex.get(agName)
    if (!ag.teamIndex.has(a.team_id)) {
      ag.teamIndex.set(a.team_id, { teamId: a.team_id, teamName: a.team_name, coaches: [] })
      ag.teams.push(ag.teamIndex.get(a.team_id))
    }
    ag.teamIndex.get(a.team_id).coaches.push(a)
  }

  const assignedIds = new Set(assignments.map(a => a.coach_id))
  const unassigned = allCoaches
    .filter(c => !assignedIds.has(c.id))
    .filter(c => matches(c.name, c.email))
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))

  // Resolve the selected coach from assignments or the full coach list
  const coachMap = new Map()
  allCoaches.forEach(c => coachMap.set(c.id, c))
  assignments.forEach(a => {
    if (!coachMap.has(a.coach_id)) {
      coachMap.set(a.coach_id, {
        id: a.coach_id,
        name: a.coach_name,
        email: a.coach_email,
        phone_number: a.phone_number,
      })
    }
  })
  const selectedCoach = selectedCoachId ? coachMap.get(selectedCoachId) ?? null : null

  return (
    <>
      <TopNav />
      <main>
      <PageHeader title="Coaches" subtitle="All coaches and their team assignments" />

      {error && (
        <div style={{ padding: '16px 24px', fontSize: 12, color: 'var(--ink-mid)' }}>
          Could not load coaches.&nbsp;
          <a href="#" onClick={e => { e.preventDefault(); refetch() }}>Try again</a>
        </div>
      )}

      {loading && (
        <div style={{ padding: '16px 24px', fontSize: 12, color: 'var(--ink-muted)' }}>Loading...</div>
      )}

      {!error && !loading && (
        <div className={`coaches-layout${!!selectedCoachId ? ' has-selection' : ''}`}>
          <div className="coaches-list-panel">
            <div className="coaches-search-wrap">
              <input
                className="coaches-search"
                type="text"
                placeholder="Search coaches..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {groups.map(ag => (
              <div key={ag.name} className="coaches-group">
                <div className="coaches-group-head">{ag.name}</div>
                {ag.teams.map(team => (
                  <div key={team.teamId} className="coaches-team">
                    <div className="coaches-team-name">{team.teamName}</div>
                    {team.coaches.map(c => (
                      <div
                        key={c.id}
                        className={`coaches-row${c.coach_id === selectedCoachId ? ' selected' : ''}`}
                        onClick={() => setSelectedCoachId(c.coach_id)}
                      >
                        <div className="coaches-row-info">
                          <span className="coaches-row-name">{c.coach_name}</span>
                          <span className="coaches-row-email">{c.coach_email}</span>
                        </div>
                        {c.is_primary && <span className="coaches-primary-pill">Primary</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}

            {unassigned.length > 0 && (
              <div className="coaches-group">
                <div className="coaches-group-head">Unassigned</div>
                {unassigned.map(c => (
                  <div
                    key={c.id}
                    className={`coaches-row${c.id === selectedCoachId ? ' selected' : ''}`}
                    onClick={() => setSelectedCoachId(c.id)}
                  >
                    <div className="coaches-row-info">
                      <span className="coaches-row-name">{c.name}</span>
                      <span className="coaches-row-email">{c.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {groups.length === 0 && unassigned.length === 0 && (
              <div className="coaches-empty">No coaches found.</div>
            )}
          </div>

          <div className="coaches-detail-col">
            {!!selectedCoachId && (
              <button
                className="mobile-back-btn"
                onClick={() => setSelectedCoachId(null)}
              >
                &#8592; Back
              </button>
            )}
            <CoachDetailPanel
              coach={selectedCoach}
              allAssignments={assignments}
              allTeams={teams}
              role={role}
              onChanged={refetch}
            />
          </div>
        </div>
      )}
      </main>
    </>
  )
}

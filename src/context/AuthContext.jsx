import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [role, setRole]         = useState(null)
  const [teamName, setTeamName] = useState(null)
  const [loading, setLoading]   = useState(true)

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('id', userId)
      .single()
    if (data) {
      setUser({ id: data.id, email: data.email, name: data.name })
      setRole(data.role)
      if (data.role === 'coach') {
        const { data: assignment } = await supabase
          .from('coach_assignments')
          .select('teams(name)')
          .eq('coach_id', userId)
          .eq('is_primary', true)
          .limit(1)
          .maybeSingle()
        setTeamName(assignment?.teams?.name ?? null)
      } else {
        setTeamName(null)
      }
    } else {
      setUser(null)
      setRole(null)
      setTeamName(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setRole(null)
          setTeamName(null)
          setLoading(false)
        } else if (event === 'SIGNED_IN' && !user) {
          fetchProfile(session.user.id)
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, error: error.message }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()
    return { success: true, role: profile?.role ?? null }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, role, teamName, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

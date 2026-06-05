import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchUsers() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .order('role', { ascending: true })
      .order('name', { ascending: true })
    if (err) {
      setError(err.message)
    } else {
      setUsers(data ?? [])
      setError(null)
    }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  return { users, loading, error, refetch: fetchUsers }
}

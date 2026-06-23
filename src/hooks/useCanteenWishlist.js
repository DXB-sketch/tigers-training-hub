import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import supabase from '../lib/supabase'

export default function useCanteenWishlist() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('canteen_wishlist')
      .select('*, added_by_profile:profiles!added_by(name)')
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setItems(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { refetch() }, [refetch])

  async function addItem(content) {
    const { error: err } = await supabase
      .from('canteen_wishlist')
      .insert({ content, added_by: user.id })
    await refetch()
    return { error: err }
  }

  return { items, loading, error, refetch, addItem }
}

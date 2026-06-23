import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import supabase from '../lib/supabase'

export default function useAdminCanteen() {
  const { user } = useAuth()
  const [shifts, setShifts] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [clockHistory, setClockHistory] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    const [
      { data: shiftsData, error: e1 },
      { data: pendingData, error: e2 },
      { data: historyData, error: e3 },
      { data: wishData, error: e4 },
    ] = await Promise.all([
      supabase
        .from('canteen_shifts')
        .select('*')
        .order('shift_date', { ascending: false })
        .order('start_time', { ascending: true }),
      supabase
        .from('canteen_clock_events')
        .select(`*, worker:profiles!worker_id(name), shift:canteen_shifts!shift_id(title, shift_date, start_time, end_time)`)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: true }),
      supabase
        .from('canteen_clock_events')
        .select(`*, worker:profiles!worker_id(name), shift:canteen_shifts!shift_id(title, shift_date, start_time, end_time)`)
        .neq('approval_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('canteen_wishlist')
        .select('*, added_by_profile:profiles!added_by(name)')
        .order('created_at', { ascending: false }),
    ])

    const err = e1?.message || e2?.message || e3?.message || e4?.message || null
    setError(err)
    setShifts(shiftsData ?? [])
    setPendingApprovals(pendingData ?? [])
    setClockHistory(historyData ?? [])
    setWishlist(wishData ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { refetch() }, [refetch])

  // --- Shift mutations ---
  async function createShift({ title, shift_date, start_time, end_time }) {
    const { error: err } = await supabase
      .from('canteen_shifts')
      .insert({ title, shift_date, start_time, end_time, created_by: user.id })
    await refetch()
    return { error: err?.message ?? null }
  }

  async function updateShift(id, { title, shift_date, start_time, end_time }) {
    const { error: err } = await supabase
      .from('canteen_shifts')
      .update({ title, shift_date, start_time, end_time })
      .eq('id', id)
    await refetch()
    return { error: err?.message ?? null }
  }

  async function deleteShift(id) {
    const { count, error: countErr } = await supabase
      .from('canteen_clock_events')
      .select('*', { count: 'exact', head: true })
      .eq('shift_id', id)
    if (countErr) return { error: countErr.message }
    if (count > 0) return { error: 'Cannot delete — clock records exist for this shift.' }
    const { error: err } = await supabase
      .from('canteen_shifts')
      .delete()
      .eq('id', id)
    await refetch()
    return { error: err?.message ?? null }
  }

  // --- Approval mutations ---
  async function approveEvent(id) {
    const { error: err } = await supabase
      .from('canteen_clock_events')
      .update({ approval_status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() })
      .eq('id', id)
    await refetch()
    return { error: err?.message ?? null }
  }

  async function rejectEvent(id) {
    const { error: err } = await supabase
      .from('canteen_clock_events')
      .update({ approval_status: 'rejected', approved_by: user.id, approved_at: new Date().toISOString() })
      .eq('id', id)
    await refetch()
    return { error: err?.message ?? null }
  }

  // --- Wishlist mutations ---
  async function updateWishStatus(id, status) {
    const { error: err } = await supabase
      .from('canteen_wishlist')
      .update({ status, resolved_by: user.id, resolved_at: new Date().toISOString() })
      .eq('id', id)
    await refetch()
    return { error: err?.message ?? null }
  }

  async function addItem(content) {
    const { error: err } = await supabase
      .from('canteen_wishlist')
      .insert({ content, added_by: user.id })
    await refetch()
    return { error: err?.message ?? null }
  }

  return {
    shifts, pendingApprovals, clockHistory, wishlist,
    loading, error, refetch,
    createShift, updateShift, deleteShift,
    approveEvent, rejectEvent,
    updateWishStatus, addItem,
  }
}

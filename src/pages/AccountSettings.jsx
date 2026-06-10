// Run this in the Supabase SQL editor to create the avatars bucket
// and set up RLS policies:
//
// INSERT INTO storage.buckets (id, name, public)
//   VALUES ('avatars', 'avatars', true);
//
// CREATE POLICY "Anyone can view avatars" ON storage.objects
//   FOR SELECT USING (bucket_id = 'avatars');
//
// CREATE POLICY "Users can upload their own avatar" ON storage.objects
//   FOR INSERT WITH CHECK (
//     bucket_id = 'avatars'
//     AND auth.uid()::text = (storage.foldername(name))[1]
//   );
//
// CREATE POLICY "Users can update their own avatar" ON storage.objects
//   FOR UPDATE USING (
//     bucket_id = 'avatars'
//     AND auth.uid()::text = (storage.foldername(name))[1]
//   );
//
// CREATE POLICY "Users can delete their own avatar" ON storage.objects
//   FOR DELETE USING (
//     bucket_id = 'avatars'
//     AND auth.uid()::text = (storage.foldername(name))[1]
//   );

import { useState, useEffect, useRef } from 'react'
import TopNav from '../components/layout/TopNav'
import PageHeader from '../components/layout/PageHeader'
import { useAuth } from '../context/AuthContext'
import supabase from '../lib/supabase'
import './AccountSettings.css'

function getInitials(name) {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0][0] ?? ''
  const last = words.length > 1 ? words[words.length - 1][0] ?? '' : ''
  return (first + last).toUpperCase()
}

export default function AccountSettings() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [savedName, setSavedName] = useState('')
  const [phone, setPhone] = useState('')
  const [savedPhone, setSavedPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [msg, setMsg] = useState({})

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('name, email, phone_number, avatar_url')
        .eq('id', user.id)
        .single()
      if (cancelled || !data) return
      setEmail(data.email ?? '')
      setName(data.name ?? '')
      setSavedName(data.name ?? '')
      setPhone(data.phone_number ?? '')
      setSavedPhone(data.phone_number ?? '')
      setAvatarUrl(data.avatar_url ?? null)
    }
    if (user?.id) load()
    return () => { cancelled = true }
  }, [user?.id])

  function showMsg(field, text, isErr) {
    setMsg(prev => ({ ...prev, [field]: { text, err: isErr } }))
    setTimeout(() => setMsg(prev => ({ ...prev, [field]: null })), 2000)
  }

  async function handleNameBlur() {
    const trimmed = name.trim()
    if (!trimmed) { setName(savedName); return }
    if (trimmed === savedName) return
    const { error } = await supabase.from('profiles').update({ name: trimmed }).eq('id', user.id)
    if (error) { showMsg('name', error.message, true); return }
    setSavedName(trimmed)
    setName(trimmed)
    showMsg('name', 'Saved', false)
  }

  async function handlePhoneBlur() {
    const trimmed = phone.trim()
    if (trimmed === savedPhone) return
    const { error } = await supabase
      .from('profiles')
      .update({ phone_number: trimmed || null })
      .eq('id', user.id)
    if (error) { showMsg('phone', error.message, true); return }
    setSavedPhone(trimmed)
    showMsg('phone', 'Saved', false)
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })
    if (upErr) { showMsg('avatar', upErr.message, true); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    // Cache-bust so the new image displays immediately on the fixed path
    const bustUrl = `${publicUrl}?t=${Date.now()}`
    const { error: updErr } = await supabase
      .from('profiles')
      .update({ avatar_url: bustUrl })
      .eq('id', user.id)
    if (updErr) { showMsg('avatar', updErr.message, true); return }
    setAvatarUrl(bustUrl)
    e.target.value = ''
  }

  async function handleRemovePhoto() {
    const { data: files } = await supabase.storage.from('avatars').list(user.id)
    if (files?.length) {
      await supabase.storage.from('avatars').remove(files.map(f => `${user.id}/${f.name}`))
    }
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id)
    if (error) { showMsg('avatar', error.message, true); return }
    setAvatarUrl(null)
  }

  return (
    <div>
      <TopNav />
      <PageHeader title="Account" subtitle="Your profile and settings" />

      <div className="account-page">
        <div className="account-field">
          <label className="account-label" htmlFor="acc-name">Full name</label>
          <input
            id="acc-name"
            className="account-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={handleNameBlur}
          />
          {msg.name && (
            <span className={`account-msg ${msg.name.err ? 'account-msg--err' : 'account-msg--ok'}`}>
              {msg.name.text}
            </span>
          )}
        </div>

        <div className="account-field">
          <label className="account-label">Email</label>
          <div className="account-value">{email}</div>
          <div className="account-note">To change your email, contact your administrator.</div>
        </div>

        <div className="account-field">
          <label className="account-label" htmlFor="acc-phone">Phone number</label>
          <input
            id="acc-phone"
            className="account-input"
            type="text"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onBlur={handlePhoneBlur}
          />
          {msg.phone && (
            <span className={`account-msg ${msg.phone.err ? 'account-msg--err' : 'account-msg--ok'}`}>
              {msg.phone.text}
            </span>
          )}
        </div>

        <div className="account-avatar-section">
          <div className="account-label">Profile photo</div>
          <div className="account-avatar-row">
            {avatarUrl ? (
              <img className="account-avatar" src={avatarUrl} alt="Profile" />
            ) : (
              <div className="account-avatar account-avatar--initials">{getInitials(name)}</div>
            )}
            <div className="account-avatar-actions">
              <button className="secondary-btn" onClick={() => fileInputRef.current?.click()}>
                Upload photo
              </button>
              {avatarUrl && (
                <button className="account-remove-photo" onClick={handleRemovePhoto}>
                  Remove photo
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              className="account-file-hidden"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>
          {msg.avatar && msg.avatar.err && (
            <span className="account-msg account-msg--err">{msg.avatar.text}</span>
          )}
        </div>
      </div>
    </div>
  )
}

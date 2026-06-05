import { useState } from 'react'
import StatusPill from '../shared/StatusPill'
import { useAuth } from '../../context/AuthContext'
import supabase from '../../lib/supabase'
import './UserDetailPanel.css'

const EDGE_FN = 'https://aotrenxljjsqjsyseyui.supabase.co/functions/v1/manage-user'

async function callManageUser(body) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(EDGE_FN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Error ${res.status}`)
  }
  return res.json().catch(() => ({}))
}

export default function UserDetailPanel({ user, inactive, onDeactivate, onReactivate }) {
  const { user: currentUser } = useAuth()

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone_number ?? '')
  const [role, setRole] = useState(user?.role ?? 'coach')
  const [fieldMsg, setFieldMsg] = useState({})

  const [newPassword, setNewPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false)
  const [statusErr, setStatusErr] = useState('')

  if (!user) {
    return (
      <div className="udp udp--empty">
        <div className="udp-empty-msg">Select a user to view details</div>
      </div>
    )
  }

  function showMsg(field, msg) {
    setFieldMsg(prev => ({ ...prev, [field]: msg }))
    setTimeout(() => setFieldMsg(prev => ({ ...prev, [field]: '' })), 2000)
  }

  async function saveField(field, value) {
    const origValue = field === 'phone_number' ? (user.phone_number ?? '') : (user[field] ?? '')
    if (value === origValue) return
    try {
      await callManageUser({ operation: 'update', userId: user.id, [field]: value })
      showMsg(field, 'Saved')
    } catch {
      showMsg(field, 'Failed to save')
    }
  }

  async function handlePasswordReset() {
    if (newPassword.length < 8) {
      setPwError('Must be at least 8 characters')
      return
    }
    setPwError('')
    try {
      await callManageUser({ operation: 'reset_password', userId: user.id, newPassword })
      setNewPassword('')
      setPwMsg('Password updated')
      setTimeout(() => setPwMsg(''), 2000)
    } catch (err) {
      setPwError(err.message)
    }
  }

  async function handleDeactivateConfirm() {
    setStatusErr('')
    try {
      await callManageUser({ operation: 'deactivate', userId: user.id })
      setShowDeactivateConfirm(false)
      onDeactivate(user.id)
    } catch (err) {
      setStatusErr(err.message)
    }
  }

  async function handleReactivateConfirm() {
    setStatusErr('')
    try {
      await callManageUser({ operation: 'reactivate', userId: user.id })
      setShowReactivateConfirm(false)
      onReactivate(user.id)
    } catch (err) {
      setStatusErr(err.message)
    }
  }

  const isSelf = currentUser?.id === user.id

  return (
    <div className="udp">
      <div className="udp-header">
        <div className="udp-name">{user.name}</div>
        <div><StatusPill status={user.role} /></div>
      </div>

      <div className="udp-section">
        <div className="udp-section-label">Account details</div>

        <div className="udp-field">
          <div className="udp-field-label">Name</div>
          <input
            className="udp-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => saveField('name', name)}
          />
          {fieldMsg.name && (
            <span className={`udp-field-msg ${fieldMsg.name === 'Saved' ? 'udp-field-msg--ok' : 'udp-field-msg--err'}`}>
              {fieldMsg.name}
            </span>
          )}
        </div>

        <div className="udp-field">
          <div className="udp-field-label">Email</div>
          <input
            className="udp-input"
            type="text"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => saveField('email', email)}
          />
          {fieldMsg.email && (
            <span className={`udp-field-msg ${fieldMsg.email === 'Saved' ? 'udp-field-msg--ok' : 'udp-field-msg--err'}`}>
              {fieldMsg.email}
            </span>
          )}
        </div>

        <div className="udp-field">
          <div className="udp-field-label">Phone number</div>
          <input
            className="udp-input"
            type="text"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onBlur={() => saveField('phone_number', phone)}
            placeholder="Not set"
          />
          {fieldMsg.phone_number && (
            <span className={`udp-field-msg ${fieldMsg.phone_number === 'Saved' ? 'udp-field-msg--ok' : 'udp-field-msg--err'}`}>
              {fieldMsg.phone_number}
            </span>
          )}
        </div>

        <div className="udp-field">
          <div className="udp-field-label">Role</div>
          <select
            className="udp-input"
            value={role}
            onChange={e => setRole(e.target.value)}
            onBlur={() => saveField('role', role)}
          >
            <option value="coach">Coach</option>
            <option value="admin">Admin</option>
            <option value="president">President</option>
          </select>
          {fieldMsg.role && (
            <span className={`udp-field-msg ${fieldMsg.role === 'Saved' ? 'udp-field-msg--ok' : 'udp-field-msg--err'}`}>
              {fieldMsg.role}
            </span>
          )}
        </div>
      </div>

      <div className="udp-section">
        <div className="udp-section-label">Reset password</div>
        <div className="udp-pw-row">
          <input
            className="udp-input udp-input--pw"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="New password"
          />
          <button className="secondary-btn" onClick={handlePasswordReset}>Reset</button>
        </div>
        {pwError && <div className="udp-pw-err">{pwError}</div>}
        {pwMsg && <div className="udp-pw-ok">{pwMsg}</div>}
      </div>

      <div className="udp-section">
        <div className="udp-section-label">Account status</div>
        {inactive ? (
          <>
            <button
              className="secondary-btn"
              onClick={() => { setShowReactivateConfirm(true); setShowDeactivateConfirm(false); setStatusErr('') }}
            >
              Reactivate account
            </button>
            {showReactivateConfirm && (
              <div className="udp-confirm">
                Are you sure?{' '}
                <button className="udp-confirm-btn" onClick={handleReactivateConfirm}>Confirm</button>
                {' '}
                <button className="udp-confirm-btn udp-confirm-btn--cancel" onClick={() => setShowReactivateConfirm(false)}>Cancel</button>
              </div>
            )}
          </>
        ) : (
          <>
            {!isSelf && (
              <button
                className="secondary-btn udp-deactivate-btn"
                onClick={() => { setShowDeactivateConfirm(true); setShowReactivateConfirm(false); setStatusErr('') }}
              >
                Deactivate account
              </button>
            )}
            {showDeactivateConfirm && (
              <div className="udp-confirm">
                Are you sure?{' '}
                <button className="udp-confirm-btn" onClick={handleDeactivateConfirm}>Confirm</button>
                {' '}
                <button className="udp-confirm-btn udp-confirm-btn--cancel" onClick={() => setShowDeactivateConfirm(false)}>Cancel</button>
              </div>
            )}
          </>
        )}
        {statusErr && <div className="udp-status-err">{statusErr}</div>}
      </div>
    </div>
  )
}

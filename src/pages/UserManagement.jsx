import { useState } from 'react'
import TopNav from '../components/layout/TopNav'
import PageHeader from '../components/layout/PageHeader'
import StatusPill from '../components/shared/StatusPill'
import UserDetailPanel from '../components/president/UserDetailPanel'
import { useUsers } from '../hooks/useUsers'
import supabase from '../lib/supabase'
import './UserManagement.css'

const ROLE_ORDER = ['president', 'admin', 'coach']
const ROLE_LABELS = { president: 'President', admin: 'Admin', coach: 'Coach' }
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

export default function UserManagement() {
  const { users, loading, error, refetch } = useUsers()
  const [selectedId, setSelectedId] = useState(null)
  const [deactivated, setDeactivated] = useState(new Set())

  const [showInvite, setShowInvite] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('coach')
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  const selectedUser = users.find(u => u.id === selectedId) ?? null

  function isInactive(user) {
    return deactivated.has(user.id)
  }

  function handleDeactivate(userId) {
    setDeactivated(prev => new Set([...prev, userId]))
  }

  function handleReactivate(userId) {
    setDeactivated(prev => {
      const next = new Set(prev)
      next.delete(userId)
      return next
    })
  }

  async function handleInviteSubmit(e) {
    e.preventDefault()
    setInviteError('')
    if (!inviteEmail.includes('@')) {
      setInviteError('Enter a valid email address')
      return
    }
    setInviteSubmitting(true)
    try {
      await callManageUser({ operation: 'invite', email: inviteEmail, name: inviteName, role: inviteRole })
      const sentTo = inviteEmail
      setInviteName('')
      setInviteEmail('')
      setInviteRole('coach')
      setShowInvite(false)
      refetch()
      setInviteSuccess(`Invite sent to ${sentTo}`)
      setTimeout(() => setInviteSuccess(''), 3000)
    } catch (err) {
      setInviteError(err.message)
    } finally {
      setInviteSubmitting(false)
    }
  }

  function handleCancelInvite() {
    setShowInvite(false)
    setInviteName('')
    setInviteEmail('')
    setInviteRole('coach')
    setInviteError('')
  }

  const grouped = ROLE_ORDER
    .map(role => ({ role, label: ROLE_LABELS[role], users: users.filter(u => u.role === role) }))
    .filter(g => g.users.length > 0)

  return (
    <div>
      <TopNav />
      <PageHeader
        title="Users"
        subtitle="Manage club accounts"
        action={
          <button className="primary-btn" onClick={() => setShowInvite(true)}>
            + Invite user
          </button>
        }
      />

      {inviteSuccess && (
        <div className="um-invite-success">{inviteSuccess}</div>
      )}

      {loading && (
        <div className="um-status-msg">Loading...</div>
      )}

      {error && (
        <div className="um-status-msg um-status-msg--err">Could not load users.</div>
      )}

      {!loading && !error && (
        <div className="um-layout">
          <div className="um-list-panel">
            {showInvite && (
              <div className="um-invite-form">
                <form onSubmit={handleInviteSubmit}>
                  <div className="um-invite-fields">
                    <div className="um-field">
                      <label className="um-field-label">Name</label>
                      <input
                        type="text"
                        value={inviteName}
                        onChange={e => setInviteName(e.target.value)}
                        required
                        placeholder="Full name"
                        className="um-input"
                      />
                    </div>
                    <div className="um-field">
                      <label className="um-field-label">Email</label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        required
                        placeholder="email@example.com"
                        className="um-input"
                      />
                    </div>
                    <div className="um-field">
                      <label className="um-field-label">Role</label>
                      <select
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value)}
                        className="um-input"
                      >
                        <option value="coach">Coach</option>
                        <option value="admin">Admin</option>
                        <option value="president">President</option>
                      </select>
                    </div>
                  </div>
                  {inviteError && <div className="um-invite-err">{inviteError}</div>}
                  <div className="um-invite-actions">
                    <button type="submit" className="primary-btn" disabled={inviteSubmitting}>
                      {inviteSubmitting ? 'Sending...' : 'Send invite'}
                    </button>
                    <button type="button" className="secondary-btn" onClick={handleCancelInvite}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {grouped.map(group => (
              <div key={group.role}>
                <div className="um-group-heading">{group.label}</div>
                {group.users.map(user => {
                  const inactive = isInactive(user)
                  const isSelected = user.id === selectedId
                  return (
                    <div
                      key={user.id}
                      className={`um-user-row${isSelected ? ' selected' : ''}${inactive ? ' inactive' : ''}`}
                      onClick={() => setSelectedId(user.id)}
                    >
                      <div className="um-user-info">
                        <div className="um-user-name">
                          {user.name}
                          {inactive && <span className="um-inactive-label"> (inactive)</span>}
                        </div>
                        <div className="um-user-email">{user.email}</div>
                      </div>
                      <div>
                        <StatusPill status={user.role} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <UserDetailPanel
            key={selectedUser?.id ?? 'empty'}
            user={selectedUser}
            inactive={selectedUser ? isInactive(selectedUser) : false}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
          />
        </div>
      )}
    </div>
  )
}

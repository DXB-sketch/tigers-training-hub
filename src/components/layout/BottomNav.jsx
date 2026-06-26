import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import MoreSheet from './MoreSheet'
import './BottomNav.css'

function HomeIcon() {
  return (
    <svg className="bottom-nav-icon" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

function SessionsIcon() {
  return (
    <svg className="bottom-nav-icon" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4" />
    </svg>
  )
}

function DrillsIcon() {
  return (
    <svg className="bottom-nav-icon" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  )
}

function AccountIcon() {
  return (
    <svg className="bottom-nav-icon" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />
    </svg>
  )
}

function DashboardIcon() {
  return (
    <svg className="bottom-nav-icon" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
    </svg>
  )
}

function TeamsIcon() {
  return (
    <svg className="bottom-nav-icon" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />
    </svg>
  )
}

function PlansIcon() {
  return (
    <svg className="bottom-nav-icon" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg className="bottom-nav-icon" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function BottomNav() {
  const { user, role, loading } = useAuth()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  if (loading || !user) return null
  if (!role || role === 'canteen') return null

  if (role === 'coach') {
    return (
      <nav className="bottom-nav">
        <NavLink
          to="/coach"
          className={({ isActive }) =>
            'bottom-nav-item' + (isActive && !location.pathname.startsWith('/coach/drill') ? ' active' : '')
          }
          end
        >
          <HomeIcon />
          <span className="bottom-nav-label">Home</span>
        </NavLink>

        <a href="/coach" className="bottom-nav-item" onClick={e => { e.preventDefault(); window.location.href = '/coach' }}>
          <SessionsIcon />
          <span className="bottom-nav-label">Sessions</span>
        </a>

        <NavLink
          to="/coach"
          className={location.pathname.startsWith('/coach/drill') ? 'bottom-nav-item active' : 'bottom-nav-item'}
        >
          <DrillsIcon />
          <span className="bottom-nav-label">Drills</span>
        </NavLink>

        <NavLink
          to="/account"
          className={({ isActive }) => 'bottom-nav-item' + (isActive ? ' active' : '')}
        >
          <AccountIcon />
          <span className="bottom-nav-label">Account</span>
        </NavLink>
      </nav>
    )
  }

  if (role === 'admin' || role === 'president') {
    return (
      <>
        <nav className="bottom-nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => 'bottom-nav-item' + (isActive ? ' active' : '')}
          >
            <DashboardIcon />
            <span className="bottom-nav-label">Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/teams"
            className={({ isActive }) => 'bottom-nav-item' + (isActive ? ' active' : '')}
          >
            <TeamsIcon />
            <span className="bottom-nav-label">Teams</span>
          </NavLink>

          <NavLink
            to="/admin/plans"
            className={({ isActive }) => 'bottom-nav-item' + (isActive ? ' active' : '')}
          >
            <PlansIcon />
            <span className="bottom-nav-label">Plans</span>
          </NavLink>

          <button
            className={'bottom-nav-item' + (moreOpen ? ' active' : '')}
            onClick={() => setMoreOpen(true)}
          >
            <MoreIcon />
            <span className="bottom-nav-label">More</span>
          </button>
        </nav>

        <MoreSheet isOpen={moreOpen} onClose={() => setMoreOpen(false)} />
      </>
    )
  }

  return null
}

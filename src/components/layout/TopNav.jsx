import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './TopNav.css'

export default function TopNav() {
  const { user, role, teamName, logout } = useAuth()
  const navigate = useNavigate()
  const [hamburgerOpen, setHamburgerOpen] = useState(false)
  const navRef = useRef(null)

  useEffect(() => {
    if (!hamburgerOpen) return
    function handleOutsideClick(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setHamburgerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [hamburgerOpen])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function handleNavClick() {
    setHamburgerOpen(false)
  }

  if (role === 'coach') {
    return (
      <nav className="top-nav" ref={navRef}>
        <span className="nav-club">Bribie Tigers</span>
        <div className="nav-right nav-right--desktop">
          <span className="nav-team-info">
            {user?.name}{teamName ? ` · ${teamName}` : ''}
          </span>
          <NavLink
            to="/account"
            className={({ isActive }) => 'nav-account-link' + (isActive ? ' active' : '')}
          >
            Account
          </NavLink>
          <button className="nav-signout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
        <button
          className="nav-hamburger"
          aria-label="Menu"
          onClick={() => setHamburgerOpen(v => !v)}
        >
          <div className="hamburger-line" />
          <div className="hamburger-line" />
          <div className="hamburger-line" />
        </button>
        {hamburgerOpen && (
          <div className="nav-dropdown">
            <NavLink
              to="/account"
              className={({ isActive }) => 'nav-dropdown-item' + (isActive ? ' active' : '')}
              onClick={handleNavClick}
            >
              Account
            </NavLink>
            <div className="nav-dropdown-role">{teamName ?? 'Coach'}</div>
            <button className="nav-dropdown-item nav-dropdown-signout" onClick={() => { handleNavClick(); handleLogout() }}>
              Sign out
            </button>
          </div>
        )}
      </nav>
    )
  }

  return (
    <nav className="top-nav" ref={navRef}>
      <NavLink to="/admin" className="nav-club">
        Bribie Tigers
      </NavLink>
      <div className="nav-links">
        {role === 'president' && (
          <NavLink
            to="/president"
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            President
          </NavLink>
        )}
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/admin/teams"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
        >
          Teams
        </NavLink>
        <NavLink
          to="/admin/coaches"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
        >
          Coaches
        </NavLink>
        <NavLink
          to="/admin/plans"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
        >
          Training Plans
        </NavLink>
      </div>
      <div className="nav-right nav-right--desktop">
        <span className="nav-user">{user?.name}</span>
        <NavLink
          to="/account"
          className={({ isActive }) => 'nav-account-link' + (isActive ? ' active' : '')}
        >
          Account
        </NavLink>
        <span className="nav-divider" />
        <span className="nav-role">{role === 'president' ? 'President' : 'Admin'}</span>
        <button className="nav-signout" onClick={handleLogout}>
          Sign out
        </button>
      </div>
      <button
        className="nav-hamburger"
        aria-label="Menu"
        onClick={() => setHamburgerOpen(v => !v)}
      >
        <div className="hamburger-line" />
        <div className="hamburger-line" />
        <div className="hamburger-line" />
      </button>
      {hamburgerOpen && (
        <div className="nav-dropdown">
          {role === 'president' && (
            <NavLink
              to="/president"
              className={({ isActive }) => 'nav-dropdown-item' + (isActive ? ' active' : '')}
              onClick={handleNavClick}
            >
              President
            </NavLink>
          )}
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => 'nav-dropdown-item' + (isActive ? ' active' : '')}
            onClick={handleNavClick}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/teams"
            className={({ isActive }) => 'nav-dropdown-item' + (isActive ? ' active' : '')}
            onClick={handleNavClick}
          >
            Teams
          </NavLink>
          <NavLink
            to="/admin/coaches"
            className={({ isActive }) => 'nav-dropdown-item' + (isActive ? ' active' : '')}
            onClick={handleNavClick}
          >
            Coaches
          </NavLink>
          <NavLink
            to="/admin/plans"
            className={({ isActive }) => 'nav-dropdown-item' + (isActive ? ' active' : '')}
            onClick={handleNavClick}
          >
            Training Plans
          </NavLink>
          <NavLink
            to="/account"
            className={({ isActive }) => 'nav-dropdown-item' + (isActive ? ' active' : '')}
            onClick={handleNavClick}
          >
            Account
          </NavLink>
          <div className="nav-dropdown-role">{role === 'president' ? 'President' : 'Admin'}</div>
        </div>
      )}
    </nav>
  )
}

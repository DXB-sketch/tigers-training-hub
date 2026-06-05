import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './TopNav.css'

export default function TopNav() {
  const { user, role, teamName, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  if (role === 'coach') {
    return (
      <nav className="top-nav">
        <span className="nav-club">Bribie Tigers</span>
        <div className="nav-right">
          <span className="nav-team-info">
            {user?.name}{teamName ? ` · ${teamName}` : ''}
          </span>
          <button className="nav-signout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </nav>
    )
  }

  return (
    <nav className="top-nav">
      <NavLink to="/admin" className="nav-club">
        Bribie Tigers
      </NavLink>
      <div className="nav-links">
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
          to="/admin/plans"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
        >
          Training Plans
        </NavLink>
      </div>
      <div className="nav-right">
        <span className="nav-user">{user?.name}</span>
        <span className="nav-role">{role === 'president' ? 'President' : 'Admin'}</span>
        <button className="nav-signout" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </nav>
  )
}

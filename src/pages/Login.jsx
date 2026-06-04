import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const { login, role } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loggedIn && role) {
      navigate(role === 'admin' ? '/admin' : '/coach')
    }
  }, [loggedIn, role])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const result = await login(email, password)
    if (result.success) {
      setLoggedIn(true)
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="login-body">
      <div className="login-wrap">
        <div className="club-mark">
          <div className="club-mark-bar" />
          <div className="club-name-lg">Bribie Island Tigers FC</div>
          <div className="club-sub">Training Hub</div>
        </div>

        <div className="form-card">
          <div className="form-title">Sign in</div>
          <div className="form-sub">Enter your credentials to access training plans</div>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@tigers.com.au"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="sign-in-btn">Sign in</button>
          </form>

          <p className="form-note">
            Contact your administrator if you need access or have forgotten your password.
          </p>
        </div>

        <div className="role-strip">
          <div className="role-pill">
            <div className="role-pill-label">Admin access</div>
            <div className="role-pill-name">Create &amp; manage plans</div>
          </div>
          <div className="role-pill">
            <div className="role-pill-label">Coach access</div>
            <div className="role-pill-name">View your sessions</div>
          </div>
        </div>
      </div>
    </div>
  )
}

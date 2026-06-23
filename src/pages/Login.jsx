import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import supabase from '../lib/supabase'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const { login, role } = useAuth()
  const navigate = useNavigate()

  const [forgotMode, setForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMsg, setResetMsg] = useState('')
  const [resetError, setResetError] = useState('')

  useEffect(() => {
    if (loggedIn && role) {
      if (role === 'admin') navigate('/admin')
      else if (role === 'president') navigate('/president')
      else if (role === 'canteen') navigate('/canteen')
      else navigate('/coach')
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

  async function handleResetSubmit(e) {
    e.preventDefault()
    setResetError('')
    setResetMsg('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail)
    if (err) {
      setResetError(err.message)
    } else {
      setResetMsg('If an account exists for that email, a reset link has been sent.')
    }
  }

  return (
    <main className="login-body">
      <div className="login-wrap">
        <div className="club-mark">
          <div className="club-mark-bar" />
          <div className="club-name-lg">Bribie Island Tigers FC</div>
          <div className="club-sub">Training Hub</div>
        </div>

        <div className="form-card">
          {forgotMode ? (
            <>
              <div className="form-title">Reset password</div>
              <div className="form-sub">Enter your email address to receive a reset link</div>

              {resetMsg ? (
                <p className="form-note">{resetMsg}</p>
              ) : (
                <form onSubmit={handleResetSubmit}>
                  <div className="form-field">
                    <label htmlFor="reset-email">Email address</label>
                    <input
                      id="reset-email"
                      type="email"
                      placeholder="you@tigers.com.au"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  {resetError && <div className="form-error">{resetError}</div>}
                  <button type="submit" className="sign-in-btn">Send reset link</button>
                </form>
              )}

              <button
                type="button"
                className="forgot-link"
                onClick={() => { setForgotMode(false); setResetEmail(''); setResetMsg(''); setResetError('') }}
              >
                Back to login
              </button>
            </>
          ) : (
            <>
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

              <button
                type="button"
                className="forgot-link"
                onClick={() => setForgotMode(true)}
              >
                Forgot password?
              </button>
            </>
          )}
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
    </main>
  )
}

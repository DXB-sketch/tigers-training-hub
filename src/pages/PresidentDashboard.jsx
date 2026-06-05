import { Link } from 'react-router-dom'
import TopNav from '../components/layout/TopNav'
import PageHeader from '../components/layout/PageHeader'
import { useUsers } from '../hooks/useUsers'
import './PresidentDashboard.css'

export default function PresidentDashboard() {
  const { users, loading } = useUsers()

  const totalUsers = users.length
  const activeCoaches = users.filter(u => u.role === 'coach').length

  function dash(val) { return loading ? '—' : val }

  return (
    <div>
      <TopNav />
      <PageHeader title="President" subtitle="Club administration" />

      <div className="pres-stats">
        <div className="pres-stat-row">
          <span className="pres-stat-label">Total users</span>
          <span className="pres-stat-val">{dash(totalUsers)}</span>
        </div>
        <div className="pres-stat-row">
          <span className="pres-stat-label">Active coaches</span>
          <span className="pres-stat-val">{dash(activeCoaches)}</span>
        </div>
      </div>

      <div className="pres-links">
        <Link className="pres-nav-link" to="/president/users">Manage users →</Link>
        <Link className="pres-nav-link" to="/admin">Training plans &amp; teams →</Link>
      </div>
    </div>
  )
}

import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth()

  if (loading) return null

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && role && !allowedRoles.includes(role)) return <Navigate to="/login" replace />

  return <>{children}</>
}

import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, role, loading } = useAuth()

  if (loading) return null

  if (!loading && !user) return <Navigate to="/login" replace />

  if (user && !role) return null

  if (requiredRole && role !== requiredRole) return <Navigate to="/login" replace />

  return children
}

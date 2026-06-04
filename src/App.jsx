import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'

import Login from './pages/Login'
import CoachDashboard from './pages/CoachDashboard'
import CoachPlanView from './pages/CoachPlanView'
import DrillViewer from './pages/DrillViewer'
import AdminDashboard from './pages/AdminDashboard'
import TeamManagement from './pages/TeamManagement'
import PlanLibrary from './pages/PlanLibrary'
import PlanBuilder from './pages/PlanBuilder'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Coach routes */}
          <Route
            path="/coach"
            element={
              <ProtectedRoute requiredRole="coach">
                <CoachDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/drill/:id"
            element={
              <ProtectedRoute requiredRole="coach">
                <DrillViewer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/plan/:planId"
            element={
              <ProtectedRoute requiredRole="coach">
                <CoachPlanView />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teams"
            element={
              <ProtectedRoute requiredRole="admin">
                <TeamManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/plans"
            element={
              <ProtectedRoute requiredRole="admin">
                <PlanLibrary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/plans/:id"
            element={
              <ProtectedRoute requiredRole="admin">
                <PlanBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/plans/:id/preview"
            element={
              <ProtectedRoute requiredRole="admin">
                <DrillViewer />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

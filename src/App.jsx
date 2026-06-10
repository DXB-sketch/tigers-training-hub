import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'

import Login from './pages/Login'
import PresidentDashboard from './pages/PresidentDashboard'
import UserManagement from './pages/UserManagement'
import CoachDashboard from './pages/CoachDashboard'
import CoachPlanView from './pages/CoachPlanView'
import DrillViewer from './pages/DrillViewer'
import AdminDashboard from './pages/AdminDashboard'
import TeamManagement from './pages/TeamManagement'
import CoachesPage from './pages/CoachesPage'
import PlanLibrary from './pages/PlanLibrary'
import PlanBuilder from './pages/PlanBuilder'
import PrintView from './pages/PrintView'
import TeamPlanView from './pages/TeamPlanView'
import AccountSettings from './pages/AccountSettings'

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
              <ProtectedRoute allowedRoles={['coach']}>
                <CoachDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/drill/:id"
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <DrillViewer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/plan/:planId/drill/:drillId"
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <DrillViewer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/plan/:planId"
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <CoachPlanView />
              </ProtectedRoute>
            }
          />

          {/* President routes */}
          <Route
            path="/president"
            element={
              <ProtectedRoute allowedRoles={['president']}>
                <PresidentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/president/users"
            element={
              <ProtectedRoute allowedRoles={['president']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin', 'president']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teams"
            element={
              <ProtectedRoute allowedRoles={['admin', 'president']}>
                <TeamManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/coaches"
            element={
              <ProtectedRoute allowedRoles={['admin', 'president']}>
                <CoachesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teams/:teamId/plans"
            element={
              <ProtectedRoute allowedRoles={['admin', 'president']}>
                <TeamPlanView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/plans"
            element={
              <ProtectedRoute allowedRoles={['admin', 'president']}>
                <PlanLibrary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/plans/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'president']}>
                <PlanBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/plans/:id/preview"
            element={
              <ProtectedRoute allowedRoles={['admin', 'president']}>
                <DrillViewer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/plans/:id/print"
            element={
              <ProtectedRoute allowedRoles={['admin', 'president']}>
                <PrintView />
              </ProtectedRoute>
            }
          />

          {/* Account settings — all roles */}
          <Route
            path="/account"
            element={
              <ProtectedRoute allowedRoles={['coach', 'admin', 'president']}>
                <AccountSettings />
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

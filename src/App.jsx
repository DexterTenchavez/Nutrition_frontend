import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Navbar from './components/common/Navbar'
import ProtectedRoute from './components/common/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DataEntry from './pages/DataEntry'
import Reports from './pages/Reports'
import OverallReport from './pages/OverallReport'
import BarangayReport from './pages/BarangayReport'
import AdminStaff from './pages/AdminStaff'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/dashboard" /> : <Login />
      } />
      <Route path="/*" element={
        <div className="min-vh-100 bg-light">
          <Navbar />
          <main className="container py-4">
            <Routes>
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/data-entry" element={
                <ProtectedRoute staffOnly>
                  <DataEntry />
                </ProtectedRoute>
              } />
              <Route path="/barangay-report" element={
                <ProtectedRoute>
                  <BarangayReport />
                </ProtectedRoute>
              } />
              <Route path="/overall-report" element={
                <ProtectedRoute adminOnly>
                  <OverallReport />
                </ProtectedRoute>
              } />
              <Route path="/admin/staff" element={
                <ProtectedRoute adminOnly>
                  <AdminStaff />
                </ProtectedRoute>
              } />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </main>
        </div>
      } />
    </Routes>
  )
}

export default App
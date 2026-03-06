import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated } from './lib/auth'
import Login from './Pages/Login'
import Register from './pages/Register'
import Landing from './Pages/Landing'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Logs from './pages/Logs'
import ApiKeys from './Pages/ApiKeys'

const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/landing" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - no layout */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes - with sidebar layout */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="logs" element={<Logs />} />
          <Route path="keys" element={<ApiKeys />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
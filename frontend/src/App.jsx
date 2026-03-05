import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated } from './lib/auth'
import Login from './pages/Login'
import Register from './pages/Register'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Logs from './pages/Logs'
import ApiKeys from './Pages/ApiKeys'
import Landing from './Pages/Landing' 
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/landing" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/landing" element={<Landing />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}></Route>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="logs" element={<Logs />} />
          <Route path="keys" element={<ApiKeys />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
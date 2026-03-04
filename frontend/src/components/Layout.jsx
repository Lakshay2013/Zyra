import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { getUser, getOrg, clearAuth } from '../lib/auth'

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  logs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
    </svg>
  ),
  keys: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
    </svg>
  )
}

export default function Layout() {
  const user = getUser()
  const org = getOrg()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>AI <span>Shield</span></h1>
          <p>LLM RISK MONITORING</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Monitor</div>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {icons.dashboard} Dashboard
          </NavLink>
          <NavLink to="/logs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {icons.logs} Logs
          </NavLink>

          <div className="nav-section-label" style={{marginTop: '12px'}}>Settings</div>
          <NavLink to="/keys" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {icons.keys} API Keys
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="org-badge">
            <strong>{org?.name || 'Organization'}</strong>
            <span>{user?.email}</span>
            <span style={{marginTop: '2px', textTransform: 'uppercase', fontSize: '9px', color: 'var(--cyan)'}}>
              {org?.plan} plan
            </span>
          </div>
          <button className="nav-item" onClick={handleLogout} style={{marginTop: '8px', padding: '7px 0'}}>
            {icons.logout} Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
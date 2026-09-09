'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import { isAuthenticated, clearAuth, getUser } from '@/lib/auth'
import api from '@/lib/api'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
  { label: 'Playground', icon: 'terminal', href: '/dashboard/playground' },
  { label: 'Security & Risk', icon: 'security', href: '/dashboard/security' },
  { label: 'Cost Analytics', icon: 'savings', href: '/dashboard/cost' },
  { label: 'Logs', icon: 'query_stats', href: '/dashboard/logs' },
  { label: 'Audit Log', icon: 'history', href: '/dashboard/audit' },
  { label: 'Providers', icon: 'dns', href: '/dashboard/providers' },
  { label: 'API Keys', icon: 'vpn_key', href: '/dashboard/apikeys' },
  { label: 'Settings', icon: 'settings', href: '/dashboard/policies' },
  { label: 'Billing', icon: 'payments', href: '/dashboard/billing' },
]

const BOTTOM_ITEMS = [
  { label: 'Team', icon: 'group', href: '/dashboard/team' },
  { label: 'Support', icon: 'contact_support', href: '#' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [orgData, setOrgData] = useState({ name: 'ZYRA', plan: 'Free' })
  const [authChecked, setAuthChecked] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [notifs, setNotifs] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)

  // Auth guard: redirect to /login if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
    } else {
      setAuthChecked(true)
    }
  }, [router])

  useEffect(() => {
    const savedOrg = localStorage.getItem('zyra_org')
    if (savedOrg) {
      try {
        const parsed = JSON.parse(savedOrg)
        setOrgData({ name: parsed.name || 'ZYRA', plan: parsed.plan || 'Free' })
      } catch (e) {
        console.error('Failed to parse org data', e)
      }
    }
  }, [])

  // Real org state (demo mode) + notifications
  const loadNotifs = async () => {
    try {
      const res = await api.get('/api/security/notifications')
      setNotifs(res.data.notifications || [])
      setUnread(res.data.unreadCount || 0)
    } catch { /* not fatal */ }
  }
  useEffect(() => {
    if (!authChecked) return
    api.get('/api/auth/me').then((r) => {
      if (r.data?.org) {
        setDemoMode(!!r.data.org.demoMode)
        setOrgData((d) => ({ ...d, name: r.data.org.name || d.name, plan: r.data.org.plan || d.plan }))
      }
    }).catch(() => {})
    loadNotifs()
    const id = setInterval(loadNotifs, 20000)
    return () => clearInterval(id)
  }, [authChecked])

  const markAllRead = async () => {
    try { await api.post('/api/security/notifications/all/read'); setUnread(0); setNotifs((n) => n.map((x) => ({ ...x, read: true }))) } catch {}
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  // Show nothing while checking auth (prevents flash of broken dashboard)
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#131314' }}>
        <div className="flex gap-3 items-center" style={{ color: '#ffa69e' }}>
          <span className="material-symbols-outlined animate-pulse">lock</span>
          <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>Verifying session...</span>
        </div>
      </div>
    )
  }

  const navContent = (
    <>
      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-6 py-3 transition-all"
              style={{
                fontSize: 10,
                letterSpacing: '0.2em',
                fontWeight: 600,
                textTransform: 'uppercase' as const,
                color: active ? '#ffa69e' : '#71717a',
                background: active ? '#201f20' : 'transparent',
                borderRight: active ? '2px solid #ffa69e' : '2px solid transparent',
              }}
            >
              <span className="material-symbols-outlined" style={{ marginRight: 16, fontSize: 20 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ borderTop: '1px solid rgba(63,63,70,0.3)', paddingTop: 16 }}>
        {BOTTOM_ITEMS.map(item => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center px-6 py-3 transition-all hover:text-zinc-300"
            style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, textTransform: 'uppercase' as const, color: '#71717a' }}
          >
            <span className="material-symbols-outlined" style={{ marginRight: 16, fontSize: 20 }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center px-6 py-3 transition-all hover:text-red-400 w-full text-left"
          style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, textTransform: 'uppercase' as const, color: '#71717a' }}
        >
          <span className="material-symbols-outlined" style={{ marginRight: 16, fontSize: 20 }}>logout</span>
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <div className="flex overflow-hidden h-screen" style={{ background: '#131314', color: '#e5e2e3', fontFamily: "'Inter', sans-serif" }}>
      {/* ── SIDEBAR (desktop) ── */}
      <aside className="hidden md:flex flex-col h-full py-6 w-64 shrink-0" style={{ borderRight: '1px solid rgba(63,63,70,0.3)', background: '#131314' }}>
        <div className="px-6 mb-8">
          <div className="text-lg font-black flex items-center gap-2" style={{ color: '#ffa69e' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>rocket_launch</span>
            {orgData.name}
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#71717a', marginTop: 4, fontWeight: 600, textTransform: 'uppercase' as const }}>v0.1.0-BETA</div>
        </div>

        {navContent}
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-72 flex flex-col py-6" style={{ background: '#131314', borderRight: '1px solid rgba(63,63,70,0.3)' }}>
            <div className="px-6 mb-8 flex items-center justify-between">
              <div className="text-lg font-black flex items-center gap-2" style={{ color: '#ffa69e' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>rocket_launch</span>
                {orgData.name}
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1" style={{ color: '#71717a' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>
            {navContent}
          </aside>
        </div>
      )}

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: '#131314' }}>
        {/* ── TOP BAR ── */}
        <header className="flex justify-between items-center w-full px-6 h-14 shrink-0" style={{ borderBottom: '1px solid rgba(63,63,70,0.2)', background: '#131314' }}>
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 rounded-lg transition-colors hover:bg-zinc-800"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              style={{ color: '#a1a1aa' }}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <Logo className="text-xl" />
          </div>
          <div className="flex items-center gap-4">
            {demoMode && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#3b0908', background: '#ffa69e', padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase' }}>
                Demo Mode
              </span>
            )}
            <div className="flex items-center gap-1">
              <div className="relative">
                <button aria-label="Notifications" onClick={() => setNotifOpen((v) => !v)} className="p-2 transition-colors hover:bg-zinc-800 relative" style={{ borderRadius: 8, color: unread > 0 ? '#ffa69e' : '#a1a1aa' }}>
                  <span className="material-symbols-outlined">notifications</span>
                  {unread > 0 && (
                    <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 99, background: '#ffb4ab', color: '#3b0908', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread}</span>
                  )}
                </button>
                {notifOpen && (
                  <div style={{ position: 'absolute', right: 0, top: '110%', width: 340, maxHeight: 420, overflowY: 'auto', background: '#201f20', border: '1px solid rgba(83,67,65,0.3)', borderRadius: 12, zIndex: 60, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
                    <div className="flex justify-between items-center px-4 py-3" style={{ borderBottom: '1px solid rgba(83,67,65,0.2)' }}>
                      <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, color: '#e5e2e3', textTransform: 'uppercase' }}>Notifications</span>
                      {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 10, color: '#ffa69e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>Mark all read</button>}
                    </div>
                    {notifs.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: '#71717a', fontSize: 12 }}>No notifications</div>
                    ) : notifs.map((n) => (
                      <Link key={n._id} href="/dashboard/security" onClick={() => setNotifOpen(false)} className="block px-4 py-3 hover:bg-[#2a2a2b]" style={{ borderBottom: '1px solid rgba(83,67,65,0.12)', opacity: n.read ? 0.55 : 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: n.severity === 'critical' ? '#ffb4ab' : '#e5e2e3' }}>{n.title}</div>
                        <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>{n.message}</div>
                        <div style={{ fontSize: 10, color: '#534341', marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{new Date(n.createdAt).toLocaleString()}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link href="/dashboard/policies" aria-label="Settings" className="p-2 transition-colors hover:bg-zinc-800" style={{ borderRadius: 8, color: '#a1a1aa' }}>
                <span className="material-symbols-outlined">settings</span>
              </Link>
              {/* User avatar with logout */}
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-full ml-2 overflow-hidden group relative"
                style={{ border: '1px solid #3f3f46' }}
                aria-label="Sign out"
                title="Sign out"
              >
                <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #ffa69e, #904a45)', borderRadius: '50%' }} />
              </button>
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#353436 #131314' }}>
          {children}
        </main>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Terminal, ShieldCheck, PiggyBank, ListTree, History,
  Server, KeyRound, Settings, CreditCard, Users, LifeBuoy, Menu, X,
  Bell, LogOut,
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { IconButton } from '@/components/ui/icon-button'
import { Popover } from '@/components/ui/popover'
import { isAuthenticated, clearAuth } from '@/lib/auth'
import api from '@/lib/api'

const NAV_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Playground', icon: Terminal, href: '/dashboard/playground' },
  { label: 'Security & Risk', icon: ShieldCheck, href: '/dashboard/security' },
  { label: 'Cost Analytics', icon: PiggyBank, href: '/dashboard/cost' },
  { label: 'Requests', icon: ListTree, href: '/dashboard/logs' },
  { label: 'Audit Log', icon: History, href: '/dashboard/audit' },
  { label: 'Providers', icon: Server, href: '/dashboard/providers' },
  { label: 'API Keys', icon: KeyRound, href: '/dashboard/apikeys' },
  { label: 'Settings', icon: Settings, href: '/dashboard/policies' },
  { label: 'Billing', icon: CreditCard, href: '/dashboard/billing' },
]

const BOTTOM_ITEMS = [
  { label: 'Team', icon: Users, href: '/dashboard/team' },
  { label: 'Support', icon: LifeBuoy, href: '#' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [orgData, setOrgData] = useState({ name: 'Zyra', plan: 'Free' })
  const [authChecked, setAuthChecked] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [notifs, setNotifs] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)

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
        setOrgData({ name: parsed.name || 'Zyra', plan: parsed.plan || 'Free' })
      } catch (e) {
        console.error('Failed to parse org data', e)
      }
    }
  }, [])

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

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg text-text-tertiary">
        <div className="flex items-center gap-2.5">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="type-meta">Verifying session…</span>
        </div>
      </div>
    )
  }

  const renderNav = (items: typeof NAV_ITEMS) => (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const active = isActive(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-[13px] font-medium transition-colors"
            style={{ color: active ? 'var(--color-text)' : 'var(--color-text-secondary)' }}
          >
            {active && (
              <motion.div
                layoutId="nav-active"
                className="absolute inset-0 rounded-[var(--radius-sm)] bg-bg-subtle"
                transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              />
            )}
            <Icon size={17} strokeWidth={1.75} className="relative z-10" />
            <span className="relative z-10">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )

  const navContent = (
    <>
      <div className="flex-1 px-3">{renderNav(NAV_ITEMS)}</div>
      <div className="border-t border-border px-3 pt-3">
        {renderNav(BOTTOM_ITEMS)}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left text-[13px] font-medium text-text-secondary transition-colors hover:text-danger"
        >
          <LogOut size={17} strokeWidth={1.75} />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-text">
      {/* ── SIDEBAR (desktop) ── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border py-5 md:flex">
        <div className="mb-6 px-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-text">
            <Logo withText={false} className="text-[20px] text-accent" />
            <span className="text-[15px] font-semibold tracking-[-0.01em]">{orgData.name}</span>
          </Link>
          <div className="mt-1 type-meta text-text-tertiary">{orgData.plan} plan</div>
        </div>
        {navContent}
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileMenuOpen(false)}
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-bg py-5"
          >
            <div className="mb-6 flex items-center justify-between px-6">
              <div className="flex items-center gap-2 text-text">
                <Logo withText={false} className="text-[20px] text-accent" />
                <span className="text-[15px] font-semibold">{orgData.name}</span>
              </div>
              <IconButton onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <X size={18} />
              </IconButton>
            </div>
            {navContent}
          </motion.aside>
        </div>
      )}

      {/* ── MAIN AREA ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* ── TOP BAR (translucent, content scrolls underneath) ── */}
        <header className="material-surface flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-3">
            <IconButton className="md:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation menu">
              <Menu size={19} />
            </IconButton>
            <Logo className="text-[16px] md:hidden" />
          </div>
          <div className="flex items-center gap-2">
            {demoMode && (
              <span className="type-meta rounded-full bg-[var(--color-accent-subtle)] px-2.5 py-1 font-medium text-accent">
                Demo mode
              </span>
            )}
            <div className="relative">
              <IconButton aria-label="Notifications" active={unread > 0} onClick={() => setNotifOpen((v) => !v)}>
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </IconButton>
              <Popover open={notifOpen} onClose={() => setNotifOpen(false)}>
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <span className="type-meta text-text">Notifications</span>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="type-meta font-semibold text-accent">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifs.length === 0 ? (
                    <div className="p-6 text-center text-[12px] text-text-tertiary">No notifications</div>
                  ) : (
                    notifs.map((n) => (
                      <Link
                        key={n._id}
                        href="/dashboard/security"
                        onClick={() => setNotifOpen(false)}
                        className="block border-b border-border px-4 py-3 transition-colors last:border-0 hover:bg-bg-subtle"
                        style={{ opacity: n.read ? 0.55 : 1 }}
                      >
                        <div className={`text-[13px] font-medium ${n.severity === 'critical' ? 'text-danger' : 'text-text'}`}>{n.title}</div>
                        <div className="mt-0.5 text-[12px] text-text-secondary">{n.message}</div>
                        <div className="mt-1 text-[11px] text-text-tertiary">{new Date(n.createdAt).toLocaleString()}</div>
                      </Link>
                    ))
                  )}
                </div>
              </Popover>
            </div>
            <Link href="/dashboard/policies">
              <IconButton aria-label="Settings">
                <Settings size={18} />
              </IconButton>
            </Link>
            <button
              onClick={handleLogout}
              className="press-feedback ml-1 h-8 w-8 overflow-hidden rounded-full"
              aria-label="Sign out"
              title="Sign out"
            >
              <div className="h-full w-full bg-gradient-to-br from-accent to-[var(--color-accent-hover)]" />
            </button>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}

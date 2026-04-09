'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [orgData, setOrgData] = useState({ name: 'PROJECT_ALPHA', plan: 'Pro' })

  useEffect(() => {
    const savedOrg = localStorage.getItem('zyra_org')
    if (savedOrg) {
      try {
        const parsed = JSON.parse(savedOrg)
        setOrgData({ name: parsed.name || 'PROJECT_ALPHA', plan: parsed.plan || 'Free' })
      } catch (e) {}
    }
  }, [])

  const navItems = [
    { label: "Dashboard", icon: "dashboard", href: "/dashboard" },
    { label: "Providers", icon: "dns", href: "/dashboard/providers" },
    { label: "Playground", icon: "terminal", href: "/dashboard/playground" },
    { label: "API Keys", icon: "vpn_key", href: "/dashboard/apikeys" },
    { label: "Analytics", icon: "query_stats", href: "/dashboard/logs" },
    { label: "Logs", icon: "list_alt", href: "/dashboard/policies" },
  ]

  const bottomItems = [
    { label: "Terminal", icon: "terminal", href: "#" },
    { label: "Support", icon: "contact_support", href: "#" },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex overflow-hidden h-screen" style={{ background: '#131314', color: '#e5e2e3', fontFamily: "'Inter', sans-serif" }}>
      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex flex-col h-full py-6 w-64 shrink-0" style={{ borderRight: '1px solid rgba(63,63,70,0.3)', background: '#131314' }}>
        <div className="px-6 mb-8">
          <div className="text-lg font-black flex items-center gap-2" style={{ color: '#ffa69e' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>rocket_launch</span>
            {orgData.name}
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#71717a', marginTop: 4, fontWeight: 600, textTransform: 'uppercase' as const }}>V2.4.0-STABLE</div>
        </div>

        <nav className="flex-1 space-y-0.5">
          {navItems.map((item) => {
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

        <div className="px-4 mb-6">
          <button
            className="w-full py-3 flex items-center justify-center gap-2 transition-transform active:scale-95"
            style={{
              borderRadius: 12,
              background: '#ffa69e',
              color: '#3b0908',
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '0.15em',
              textTransform: 'uppercase' as const,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            New Deployment
          </button>
        </div>

        <div style={{ borderTop: '1px solid rgba(63,63,70,0.3)', paddingTop: 16 }}>
          {bottomItems.map(item => (
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
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: '#131314' }}>
        {/* ── TOP BAR ── */}
        <header className="flex justify-between items-center w-full px-6 h-14 shrink-0" style={{ borderBottom: '1px solid rgba(63,63,70,0.2)', background: '#131314' }}>
          <div className="flex items-center gap-8">
            <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', color: '#ffa69e' }}>ZYRA</span>
            <div className="hidden lg:flex items-center px-3 py-1.5 w-96" style={{ background: '#1c1b1c', borderRadius: 8 }}>
              <span className="material-symbols-outlined" style={{ color: '#71717a', fontSize: 16, marginRight: 8 }}>search</span>
              <input
                className="bg-transparent border-none focus:outline-none text-xs font-medium w-full p-0"
                placeholder="Search systems..."
                style={{ color: '#a1a1aa' }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex gap-6 mr-4" style={{ fontWeight: 500 }}>
              {['Dashboard', 'Deployments', 'Docs'].map((t, i) => (
                <a key={t} href="#" style={{ color: i === 0 ? '#ffa69e' : '#a1a1aa', fontWeight: i === 0 ? 700 : 400, fontSize: 14 }}>{t}</a>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {['terminal', 'notifications', 'settings'].map(icon => (
                <button key={icon} className="p-2 transition-colors hover:bg-zinc-800" style={{ borderRadius: 8, color: '#a1a1aa' }}>
                  <span className="material-symbols-outlined">{icon}</span>
                </button>
              ))}
              <div className="w-8 h-8 rounded-full ml-2 overflow-hidden" style={{ border: '1px solid #3f3f46' }}>
                <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #ffa69e, #904a45)', borderRadius: '50%' }} />
              </div>
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#353436 #131314' }}>
          {children}
        </main>
      </div>

      {/* Material Symbols font link */}
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
    </div>
  )
}

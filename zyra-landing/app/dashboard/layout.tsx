'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Activity, Key, LayoutGrid, LogOut, 
  Plug, Shield, Users, CreditCard, 
  Terminal, BookOpen, LifeBuoy 
} from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [orgData, setOrgData] = useState({ name: 'Acme Corp', plan: 'Starter' })

  useEffect(() => {
    const savedOrg = localStorage.getItem('zyra_org')
    if (savedOrg) {
      try {
        const parsed = JSON.parse(savedOrg)
        setOrgData({ name: parsed.name || 'Your Org', plan: 'Starter' })
      } catch (e) {}
    }
  }, [])

  const navGroups = [
    {
      title: "CORE",
      items: [
        { label: "Overview", icon: LayoutGrid, href: "/dashboard" },
        { label: "API Keys", icon: Key, href: "/dashboard/apikeys" },
        { label: "Providers", icon: Plug, href: "/dashboard/providers" },
        { label: "Playground", icon: Terminal, href: "/dashboard/playground" },
      ]
    },
    {
      title: "MONITORING",
      items: [
        { label: "Logs", icon: Activity, href: "/dashboard/logs" },
        { label: "Firewall Policies", icon: Shield, href: "/dashboard/policies" },
      ]
    },
    {
      title: "ORGANIZATION",
      items: [
        { label: "Team", icon: Users, href: "/dashboard/team" },
        { label: "Billing", icon: CreditCard, href: "/dashboard/billing" },
      ]
    }
  ]

  const bottomLinks = [
    { label: "Documentation", icon: BookOpen, href: "#" },
    { label: "Support", icon: LifeBuoy, href: "#" }
  ]

  return (
    <div className="min-h-screen bg-background text-on-background flex font-body selection:bg-primary-container selection:text-on-primary-container">
      {/* Sidebar - Added padding bottom and scroll area for longer content */}
      <aside className="fixed top-0 left-0 h-screen w-[240px] bg-surface-container border-r border-outline-variant/10 z-40 hidden md:flex flex-col">
        <div className="px-8 py-8 shrink-0">
          <Link href="/" className="text-[28px] font-headline italic font-bold text-primary tracking-tight hover:opacity-80 transition-opacity">
            zyra
          </Link>
        </div>

        {/* Scrollable Nav Area */}
        <nav className="flex-1 px-4 py-2 space-y-6 overflow-y-auto scrollbar-hide">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="px-4 font-label text-[10px] font-bold tracking-[0.2em] text-on-surface-variant/60 uppercase mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard' && item.href !== '/dashboard/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 
                        ${isActive ? "text-primary bg-primary/10" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"}`}
                    >
                      <item.icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-outline-variant/10 bg-surface-container shrink-0">
          <div className="px-2 mb-4 space-y-1">
            {bottomLinks.map(link => (
              <Link key={link.label} href={link.href} className="flex items-center space-x-3 px-2 py-2 rounded-lg text-[13px] font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors">
                <link.icon className="w-[16px] h-[16px]" strokeWidth={2.5} />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="px-4 py-3 mb-2 bg-surface-container-lowest rounded-xl border border-outline-variant/10">
            <p className="text-sm font-bold text-on-surface truncate">{orgData.name}</p>
            <p className="font-label text-[10px] uppercase tracking-wider font-bold text-primary mt-0.5">{orgData.plan} Plan</p>
          </div>
          
          <button
            onClick={() => {
               localStorage.clear()
               window.location.href = '/login'
            }}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-on-surface-variant hover:text-error hover:bg-error-container/10 transition-colors"
          >
            <LogOut className="w-[16px] h-[16px]" strokeWidth={2.5} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[240px] min-h-screen">
        <div className="p-8 md:p-12">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Overlay Decoration: Grid Lines */}
      <div className="fixed inset-0 pointer-events-none opacity-5 z-0">
        <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(#484551 1px, transparent 1px), linear-gradient(90deg, #484551 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, Key, LayoutGrid, LogOut } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [orgData, setOrgData] = useState({ name: 'Acme Corp', plan: 'Starter' }) // Mock user data

  useEffect(() => {
    // In a real app we'd fetch the user's org info from backend here
    const savedOrg = localStorage.getItem('zyra_org')
    if (savedOrg) {
      try {
        const parsed = JSON.parse(savedOrg)
        setOrgData({ name: parsed.name || 'Your Org', plan: 'Starter' })
      } catch (e) {}
    }
  }, [])

  const navItems = [
    { label: "Overview", icon: LayoutGrid, href: "/dashboard" },
    { label: "Logs", icon: Activity, href: "/dashboard/logs" },
    { label: "API Keys", icon: Key, href: "/dashboard/apikeys" },
  ]

  return (
    <div className="min-h-screen bg-[#fdfaea] text-[#032416] flex font-body">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-[240px] bg-white border-r border-[#f1eedf] z-40 hidden md:flex flex-col">
        <div className="px-8 py-8">
          <Link href="/" className="text-[28px] font-headline italic font-bold text-[#032416] tracking-tight hover:opacity-80 transition-opacity">
            zyra
          </Link>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-200 
                  ${isActive ? "text-[#5e51ad] bg-[#5e51ad]/5" : "text-[#424843] hover:text-[#032416] hover:bg-[#f1eedf]/50"}`}
              >
                <item.icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-[#f1eedf]">
          <div className="px-4 py-3 mb-2">
            <p className="text-sm font-bold text-[#032416] truncate">{orgData.name}</p>
            <p className="text-xs font-semibold text-[#5e51ad] mt-0.5">{orgData.plan} Plan</p>
          </div>
          
          <button
            onClick={() => {
               localStorage.clear()
               window.location.href = '/login'
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#424843] hover:text-[#d32f2f] hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
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
    </div>
  )
}

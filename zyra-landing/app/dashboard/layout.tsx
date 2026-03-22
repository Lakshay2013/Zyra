'use client'

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, Key, LayoutGrid, LogOut, Search, Settings } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState<string | null>(null)

  const navItems = [
    { label: "Overview", icon: LayoutGrid, href: "/dashboard" },
    { label: "Logs Explorer", icon: Activity, href: "/dashboard/logs" },
    { label: "API Keys", icon: Key, href: "/dashboard/apikeys" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ]

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex selection:bg-stone-800">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-64 border-r border-stone-800/50 bg-stone-950/50 backdrop-blur-xl z-40 hidden md:flex flex-col">
        <div className="p-6">
          <Link href="/" className="text-2xl font-headline italic font-bold text-white tracking-wider hover:opacity-80 transition-opacity">
            zyra
          </Link>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => setIsHovered(item.href)}
                onMouseLeave={() => setIsHovered(null)}
                className={`relative flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 z-10 
                  ${isActive ? "text-white" : "text-stone-400 hover:text-white"}`}
              >
                {/* Active Indicator Background */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-stone-800/60 border border-stone-700/50 rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                {/* Hover Indicator */}
                {isHovered === item.href && !isActive && (
                  <motion.div
                    layoutId="hoverNavTab"
                    className="absolute inset-0 bg-stone-800/30 rounded-lg -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}

                <item.icon className={`w-4 h-4 ${isActive ? "text-green-400" : ""}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-stone-800/50">
          <Link
            href="/"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-stone-400 hover:text-white hover:bg-red-500/10 transition-colors group"
          >
            <LogOut className="w-4 h-4 group-hover:text-red-400" />
            <span className="group-hover:text-red-400">Log out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 h-16 border-b border-stone-800/50 bg-stone-950/80 backdrop-blur-xl z-30 flex items-center justify-between px-8">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input 
                type="text" 
                placeholder="Search logs, keys, or settings..." 
                className="w-full bg-stone-900/50 border border-stone-800 rounded-full pl-10 pr-4 py-1.5 text-sm text-stone-200 focus:outline-none focus:border-stone-600 focus:ring-1 focus:ring-stone-600 transition-all placeholder:text-stone-600"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center overflow-hidden hover:border-stone-500 transition-colors text-xs font-bold font-mono">
              U
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8">
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

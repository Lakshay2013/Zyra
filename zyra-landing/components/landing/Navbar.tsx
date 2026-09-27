'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Moon, Sun, X } from '@/components/ui/icons'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'

const LINKS = [
  { href: '/docs', label: 'Docs' },
  { href: '#providers', label: 'Providers' },
  { href: '#capabilities', label: 'Capabilities' },
  { href: 'https://github.com/Lakshay2013/Zyra', label: 'GitHub', external: true },
]

export function Navbar() {
  const [floating, setFloating] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggle } = useTheme()
  const ticking = useRef(false)

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        setFloating(window.scrollY > 24)
        ticking.current = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  return (
    <>
      <header className="sticky top-0 z-50 flex justify-center px-4 pt-3">
        <div
          className={`flex w-full items-center justify-between transition-[max-width,background-color,border-color,box-shadow,padding] duration-300 ${
            floating
              ? 'max-w-3xl rounded-full border border-border bg-bg-elevated/80 px-4 py-2 shadow-lg backdrop-blur-xl'
              : 'max-w-6xl border-transparent bg-transparent px-2 py-3'
          }`}
        >
          <Link href="/" className="flex items-center gap-2 text-text">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-[13px] font-medium text-text-secondary md:flex">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target={l.external ? '_blank' : undefined}
                rel={l.external ? 'noreferrer' : undefined}
                className="transition-colors hover:text-text"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              aria-label="Toggle theme"
              onClick={toggle}
              className="press-feedback hidden h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-bg-subtle hover:text-text md:flex"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <Link href="/register" className="hidden md:block">
              <Button size="sm">Get API Key</Button>
            </Link>
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="press-feedback flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-bg-subtle md:hidden"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex flex-col bg-bg p-6 md:hidden"
          >
            <div className="flex items-center justify-between">
              <Logo />
              <button
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="press-feedback flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-bg-subtle"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="mt-12 flex flex-col gap-1">
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.label}
                  href={l.href}
                  target={l.external ? '_blank' : undefined}
                  rel={l.external ? 'noreferrer' : undefined}
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, type: 'spring', bounce: 0, duration: 0.3 }}
                  className="border-b border-border py-4 text-[20px] font-medium text-text"
                >
                  {l.label}
                </motion.a>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3">
              <button
                onClick={toggle}
                className="flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-border py-3 text-[14px] font-medium text-text"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                {theme === 'light' ? 'Dark mode' : 'Light mode'}
              </button>
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                <Button className="w-full" size="lg">Get API Key</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

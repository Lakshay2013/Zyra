'use client'
import { useEffect, useState } from 'react'
import { X } from '@/components/ui/icons'

const ITEMS = ['v0.1.0-beta', 'Four providers, one endpoint', 'MIT licensed', 'Self-host with one docker compose up']
const STORAGE_KEY = 'zyra-announcement-dismissed'

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(true) // default hidden until we know localStorage says otherwise (avoids flash)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === 'true')
    } catch {
      setDismissed(false)
    }
  }, [])

  if (!mounted || dismissed) return null

  const track = ITEMS.join('   ·   ')

  return (
    <div className="relative flex h-9 items-center overflow-hidden border-b border-border bg-bg-subtle text-[12px] font-medium text-text-secondary">
      <div className="marquee-track flex shrink-0 whitespace-nowrap">
        <span className="px-4 type-mono">{track}</span>
        <span className="px-4 type-mono" aria-hidden="true">{track}</span>
      </div>
      <button
        aria-label="Dismiss announcement"
        onClick={() => {
          setDismissed(true)
          try {
            localStorage.setItem(STORAGE_KEY, 'true')
          } catch {
            // ignore
          }
        }}
        className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-text-tertiary hover:bg-bg-elevated hover:text-text"
      >
        <X size={13} />
      </button>
    </div>
  )
}

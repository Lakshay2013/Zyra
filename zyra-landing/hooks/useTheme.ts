'use client'
import { useCallback, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const STORAGE_KEY = 'zyra-landing-theme'

// Applies to the nearest ancestor with the `.zyra-landing` class only —
// the rest of the app has no data-theme attribute and is unaffected.
export function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
      setTheme(stored ?? (document.documentElement.getAttribute('data-zyra-theme') as Theme | null))
    } catch {
      setTheme(null)
    }
  }, [])

  const applyTheme = useCallback((next: Theme) => {
    setTheme(next)
    const root = document.querySelector('.zyra-landing')
    root?.setAttribute('data-theme', next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // storage unavailable (private mode) — theme just won't persist
    }
  }, [])

  const toggle = useCallback(() => {
    // Unattributed state renders light (the designed default), so an unset `theme` is 'light'.
    const current = theme ?? 'light'
    applyTheme(current === 'dark' ? 'light' : 'dark')
  }, [theme, applyTheme])

  return { theme, toggle }
}

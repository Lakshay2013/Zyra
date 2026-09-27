'use client'
import { useEffect, useRef, useState } from 'react'

// Fires once, then unobserves. Used for one-shot reveal-on-scroll (not decorative fade-up spam).
export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        io.unobserve(el)
      }
    }, options ?? { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { ref, inView }
}

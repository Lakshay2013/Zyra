'use client'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

// Counts up once, when the element scrolls into view. rAF-driven, IntersectionObserver-gated.
export function useCountUp<T extends HTMLElement>(target: number, duration = 900) {
  const ref = useRef<T | null>(null)
  const [value, setValue] = useState(0)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (reducedMotion) {
      setValue(target)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.unobserve(el)

        const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setValue(target * eased)
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [target, duration, reducedMotion])

  return { ref, value }
}

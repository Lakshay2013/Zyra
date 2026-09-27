'use client'
import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Anchored popover — scales/fades from the trigger's corner (top-right by
 * default), not a generic center fade. Closes on outside click and Escape.
 */
export function Popover({ open, onClose, align = 'right', className, children }: {
  open: boolean
  onClose: () => void
  align?: 'left' | 'right'
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -4 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
          style={{ transformOrigin: align === 'right' ? 'top right' : 'top left' }}
          className={cn(
            'material-surface absolute top-full z-50 mt-2 w-80 overflow-hidden rounded-[var(--radius-md)] border border-border shadow-[var(--shadow-md)]',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

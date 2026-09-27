'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function Tabs({ items, active, onChange, layoutId = 'tabs-indicator' }: {
  items: { value: string; label: string }[]
  active: string
  onChange: (value: string) => void
  layoutId?: string
}) {
  return (
    <div className="flex items-center gap-1 border-b border-border">
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'relative press-feedback px-3.5 py-2.5 text-[13px] font-medium transition-colors',
            active === item.value ? 'text-text' : 'text-text-tertiary hover:text-text-secondary'
          )}
        >
          {item.label}
          {active === item.value && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-x-0 -bottom-px h-[2px] bg-text"
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            />
          )}
        </button>
      ))}
    </div>
  )
}

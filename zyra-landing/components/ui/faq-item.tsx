'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from '@/components/ui/icons'

export function FAQItem({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div className={`rounded-[var(--radius-md)] border transition-colors ${open ? 'border-border-strong bg-bg-elevated' : 'border-border hover:bg-bg-subtle'}`}>
      <button onClick={onClick} className="flex w-full items-center justify-between px-6 py-5 text-left">
        <span className="type-h3 text-text">{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
          className="ml-4 shrink-0 text-text-tertiary"
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-[14px] leading-relaxed text-text-secondary">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

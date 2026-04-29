import React from 'react'

/**
 * FAQItem provides an accessible accordion item for Q&A sections.
 * @param {string} q - The question text.
 * @param {string} a - The answer text.
 * @param {boolean} open - Whether the accordion is currently expanded.
 * @param {function} onClick - Callback when the accordion header is clicked.
 */
export function FAQItem({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div className={`border border-white/[0.06] rounded-xl overflow-hidden transition-colors ${open ? 'bg-brand-surface faq-open' : 'bg-transparent hover:bg-white/[0.02]'}`}>
      <button onClick={onClick} className="w-full flex items-center justify-between px-6 py-5 text-left">
        <span className="text-[15px] font-semibold text-white">{q}</span>
        <span className="faq-chevron text-gray-500 text-lg ml-4">▾</span>
      </button>
      <div className="faq-content" style={{ maxHeight: open ? '200px' : '0px', opacity: open ? 1 : 0 }}>
        <p className="px-6 pb-5 text-[14px] text-gray-400 leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

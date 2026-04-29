'use client'
import React from 'react'

/**
 * CopyButton provides a click-to-copy interface for code snippets.
 * @param {string} text - The text content to be copied.
 */
export function CopyButton({ text }: { text: string }) {
  const handleCopy = async (e: React.MouseEvent) => {
    const btn = e.currentTarget as HTMLElement
    await navigator.clipboard.writeText(text)
    btn.classList.add('copied')
    setTimeout(() => btn.classList.remove('copied'), 2000)
  }
  return (
    <button onClick={handleCopy} className="copy-btn absolute top-4 right-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-gray-400 hover:text-white transition-all z-10 font-sans">
      <span className="copy-icon">Copy</span>
      <span className="check-icon text-green-400">✓ Copied</span>
    </button>
  )
}

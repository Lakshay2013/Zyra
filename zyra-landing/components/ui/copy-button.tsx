'use client'
import { useState } from 'react'
import { Check, Copy } from '@/components/ui/icons'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="press-feedback absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-bg-elevated px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:text-text"
    >
      {copied ? (
        <>
          <Check size={13} className="text-success" /> Copied
        </>
      ) : (
        <>
          <Copy size={13} /> Copy
        </>
      )}
    </button>
  )
}

import React from 'react'

export function Logo({ className = '', withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg 
        width="1em" 
        height="1em" 
        viewBox="0 0 32 32" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-[#FF6B6B]"
      >
        <path d="M 8 8 L 24 8" />
        <path d="M 8 24 L 24 24" />
        <path d="M 8 8 L 13 16 L 8 24" />
        <path d="M 24 8 L 19 16 L 24 24" />
        <circle cx="8" cy="8" r="3" fill="currentColor" stroke="none" />
        <circle cx="24" cy="8" r="3" fill="currentColor" stroke="none" />
        <circle cx="8" cy="24" r="3" fill="currentColor" stroke="none" />
        <circle cx="24" cy="24" r="3" fill="currentColor" stroke="none" />
      </svg>
      {withText && (
        <span className="text-current text-xl font-bold tracking-tight lowercase font-sans">
          zyra
        </span>
      )}
    </div>
  )
}

import React from 'react'
import { cn } from '@/lib/utils'

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse text-left text-[13px]', className)}>{children}</table>
    </div>
  )
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-border">{children}</thead>
}

export function TH({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={cn('type-meta whitespace-nowrap px-4 py-3 font-medium text-text-tertiary', align === 'right' && 'text-right')}>
      {children}
    </th>
  )
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>
}

export function TR({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr
      onClick={onClick}
      className={cn('transition-colors', onClick && 'cursor-pointer hover:bg-bg-subtle', className)}
    >
      {children}
    </tr>
  )
}

export function TD({ children, align = 'left', className }: { children: React.ReactNode; align?: 'left' | 'right'; className?: string }) {
  return <td className={cn('whitespace-nowrap px-4 py-3.5 text-text', align === 'right' && 'text-right', className)}>{children}</td>
}

import React from 'react'
import { cn } from '@/lib/utils'

export const IconButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }>(
  ({ className, active, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'press-feedback flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary transition-colors hover:bg-bg-subtle hover:text-text',
        active && 'bg-bg-subtle text-text',
        className
      )}
      {...props}
    />
  )
)
IconButton.displayName = 'IconButton'

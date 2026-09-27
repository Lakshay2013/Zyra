import * as React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated px-3.5 py-2.5 text-[14px] text-text placeholder:text-text-tertiary transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-[var(--color-accent-subtle)]',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full resize-none rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated px-3.5 py-2.5 text-[14px] leading-relaxed text-text placeholder:text-text-tertiary transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-[var(--color-accent-subtle)]',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn('mb-1.5 block text-[13px] font-medium text-text', className)} {...props} />
  )
)
Label.displayName = 'Label'

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full appearance-none rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated px-3.5 py-2.5 text-[14px] text-text transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-[var(--color-accent-subtle)]',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
)
Select.displayName = 'Select'

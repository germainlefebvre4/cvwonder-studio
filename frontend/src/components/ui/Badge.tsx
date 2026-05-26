import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'success' | 'error' | 'warning' | 'neutral'

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-[var(--color-success-subtle)] text-[var(--color-success-text)]',
  error:   'bg-[var(--color-error-subtle)]   text-[var(--color-error-text)]',
  warning: 'bg-[var(--color-accent-subtle)]  text-[var(--color-accent-text)]',
  neutral: 'bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)]',
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ variant = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'text-xs px-1.5 py-0.5 rounded-full font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}

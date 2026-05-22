import * as React from 'react'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary'
type Size = 'sm' | 'md' | 'lg'

interface SplitButtonOption {
  label: string
  value: string
  description?: string
}

interface SplitButtonProps {
  /** Label for the primary action zone */
  label: string
  /** Called when the primary zone is clicked */
  onClick: () => void
  /** Options shown in the dropdown (chevron zone) */
  options?: SplitButtonOption[]
  /** Called when a dropdown option is selected */
  onOptionSelect?: (value: string) => void
  variant?: Variant
  size?: Size
  disabled?: boolean
  className?: string
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]',
  secondary:
    'bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-overlay)]',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-[var(--radius-sm)]',
  md: 'px-4 py-2 text-sm rounded-[var(--radius-md)]',
  lg: 'px-6 py-3 text-base rounded-[var(--radius-md)]',
}

const chevronSizeClasses: Record<Size, string> = {
  sm: 'px-2 py-1.5 rounded-[var(--radius-sm)]',
  md: 'px-2.5 py-2 rounded-[var(--radius-md)]',
  lg: 'px-3 py-3 rounded-[var(--radius-md)]',
}

export function SplitButton({
  label,
  onClick,
  options = [],
  onOptionSelect,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
}: SplitButtonProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
    variantClasses[variant],
  )

  const hasOptions = options.length > 0

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      {/* Primary action */}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          baseClasses,
          sizeClasses[size],
          hasOptions && 'rounded-r-none border-r border-r-white/20',
        )}
      >
        {label}
      </button>

      {/* Chevron / dropdown trigger */}
      {hasOptions && (
        <>
          <button
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              baseClasses,
              chevronSizeClasses[size],
              'rounded-l-none border-l border-l-white/20',
            )}
          >
            <ChevronDownIcon
              className={cn('transition-transform duration-150', open && 'rotate-180')}
            />
          </button>

          {open && (
            <ul
              role="listbox"
              className="absolute right-0 top-full mt-1.5 z-50 min-w-[220px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-default)] shadow-lg py-1"
            >
              {options.map((opt) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={false}
                  className="flex flex-col gap-0.5 px-3 py-2 cursor-pointer hover:bg-[var(--color-surface-subtle)] transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setOpen(false)
                    onOptionSelect?.(opt.value)
                  }}
                >
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {opt.label}
                  </span>
                  {opt.description && (
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {opt.description}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

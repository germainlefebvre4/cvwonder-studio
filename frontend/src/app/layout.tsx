import type { ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/Tooltip'

interface LayoutProps {
  children: ReactNode
}

/**
 * RootLayout wraps all pages with shared providers.
 * Fonts are loaded via CSS/Google Fonts; Radix TooltipProvider is required
 * at the root level for Tooltip to work anywhere in the tree.
 */
export default function RootLayout({ children }: LayoutProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen flex flex-col bg-[var(--color-surface-default)] text-[var(--color-text-primary)]">
        {children}
      </div>
    </TooltipProvider>
  )
}

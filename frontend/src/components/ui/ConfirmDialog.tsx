import * as React from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => Promise<void>
  children: React.ReactNode
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'primary',
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      await onConfirm()
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) setOpen(v) }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-[var(--color-error)] mt-2">{error}</p>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <DialogClose asChild>
            <Button variant="secondary" size="sm" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            disabled={loading}
            onClick={handleConfirm}
          >
            {loading ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

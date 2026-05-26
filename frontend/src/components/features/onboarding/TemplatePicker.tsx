import { useEffect, useState } from 'react'
import { getTemplates, type Template } from '@/services/templates'

interface TemplatePickerProps {
  onSelect: (slug: string) => void
}

export default function TemplatePicker({ onSelect }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getTemplates()
      .then(setTemplates)
      .catch(() => setError('Could not load templates.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col h-full overflow-auto p-6 gap-6">
      <div>
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
          Start with a template
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Pick one to pre-fill your CV, or start from scratch.
        </p>
      </div>

      {error && (
        <p className="text-sm text-[var(--color-error-text)]">{error}</p>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <button
              key={t.slug}
              onClick={() => onSelect(t.slug)}
              className="text-left border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-surface-default)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] transition-colors cursor-pointer"
            >
              <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                {t.name}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] leading-snug">
                {t.description}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Always-visible "start from scratch" option */}
      <div className="mt-auto pt-4 border-t border-[var(--color-border-subtle)]">
        <button
          onClick={() => onSelect('minimal')}
          className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          Start from scratch →
        </button>
      </div>
    </div>
  )
}

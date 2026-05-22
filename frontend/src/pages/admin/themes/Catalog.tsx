import { useEffect, useState } from 'react'
import { getCatalog, CatalogTheme } from '@/services/admin'
import VersionPicker from './VersionPicker'

export default function Catalog() {
  const [catalog, setCatalog] = useState<CatalogTheme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [picking, setPicking] = useState<CatalogTheme | null>(null)

  useEffect(() => {
    getCatalog()
      .then(setCatalog)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load catalog'))
      .finally(() => setLoading(false))
  }, [])

  function handleInstalled() {
    setPicking(null)
    getCatalog().then(setCatalog).catch(() => {})
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Theme Catalog</h1>
      </div>

      {error && (
        <p className="text-sm text-[var(--color-error)] mb-4">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-[var(--color-text-secondary)]">Loading…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((theme) => (
            <div
              key={theme.slug}
              className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-surface-default)] flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{theme.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] font-mono">{theme.slug}</p>
                </div>
                {theme.installed && (
                  <span className="shrink-0 px-1.5 py-0.5 text-xs rounded-full bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)]">
                    installed
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                <a
                  href={`https://github.com/${theme.repo}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-[var(--color-text-primary)]"
                >
                  {theme.repo}
                </a>
              </p>
              <button
                onClick={() => setPicking(theme)}
                className="mt-auto px-3 py-1.5 text-xs bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                {theme.installed ? 'Reinstall / Update' : 'Install'}
              </button>
            </div>
          ))}
        </div>
      )}

      {picking && (
        <VersionPicker
          theme={picking}
          onClose={() => setPicking(null)}
          onInstalled={handleInstalled}
        />
      )}
    </div>
  )
}

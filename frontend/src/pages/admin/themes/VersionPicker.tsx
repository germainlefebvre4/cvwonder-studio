import { useEffect, useState } from 'react'
import { getCatalogVersions, installTheme, VersionInfo, CatalogTheme } from '@/services/admin'

interface VersionPickerProps {
  theme: CatalogTheme
  onClose: () => void
  onInstalled: () => void
}

export default function VersionPicker({ theme, onClose, onInstalled }: VersionPickerProps) {
  const [versions, setVersions] = useState<VersionInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState('')
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    getCatalogVersions(theme.slug)
      .then((v) => {
        setVersions(v)
        if (v.length > 0) setSelected(v[0].ref)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load versions'))
      .finally(() => setLoading(false))
  }, [theme.slug])

  async function handleInstall() {
    if (!selected) return
    setInstalling(true)
    try {
      await installTheme(theme.slug, selected)
      onInstalled()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Install failed')
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-[var(--color-surface-default)] border border-[var(--color-border)] rounded-lg shadow-xl p-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
          Install {theme.name}
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] mb-4">{theme.repo}</p>

        {error && (
          <p className="text-sm text-[var(--color-error)] mb-3">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-[var(--color-text-secondary)]">Loading versions…</p>
        ) : versions.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">No versions found.</p>
        ) : (
          <div className="mb-4">
            <label
              htmlFor="version-select"
              className="block text-xs text-[var(--color-text-secondary)] mb-1"
            >
              Version
            </label>
            <select
              id="version-select"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            >
              {versions.map((v) => (
                <option key={v.ref} value={v.ref}>
                  {v.name} ({v.ref})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-subtle)] transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={installing || !selected || loading}
            onClick={handleInstall}
            className="px-3 py-1.5 text-sm bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
          >
            {installing ? 'Installing…' : 'Install'}
          </button>
        </div>
      </div>
    </div>
  )
}

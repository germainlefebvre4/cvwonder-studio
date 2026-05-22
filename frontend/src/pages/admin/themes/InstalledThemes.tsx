import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAdminThemes, deleteAdminTheme, checkThemeUpdates, AdminTheme } from '@/services/admin'

export default function InstalledThemes() {
  const [themes, setThemes] = useState<AdminTheme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      setThemes(await listAdminThemes())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load themes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCheck(slug: string) {
    setBusy(slug)
    try {
      const result = await checkThemeUpdates(slug)
      await load()
      if (result.update_available) {
        alert(`Update available: ${result.latest_ref}`)
      } else {
        alert('Already up to date')
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Check failed')
    } finally {
      setBusy(null)
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm(`Delete theme "${slug}"?`)) return
    setBusy(slug)
    try {
      await deleteAdminTheme(slug)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Installed Themes</h1>
        <Link
          to="/admin/themes/catalog"
          className="px-3 py-1.5 text-sm bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Browse Catalog
        </Link>
      </div>

      {error && (
        <p className="text-sm text-[var(--color-error)] mb-4">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-[var(--color-text-secondary)]">Loading…</p>
      ) : themes.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">No themes installed.</p>
      ) : (
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-subtle)]">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-[var(--color-text-secondary)]">Name</th>
                <th className="px-4 py-2 text-left font-medium text-[var(--color-text-secondary)]">Slug</th>
                <th className="px-4 py-2 text-left font-medium text-[var(--color-text-secondary)]">Installed</th>
                <th className="px-4 py-2 text-left font-medium text-[var(--color-text-secondary)]">Latest</th>
                <th className="px-4 py-2 text-left font-medium text-[var(--color-text-secondary)]">Type</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {themes.map((theme) => (
                <tr key={theme.id} className="hover:bg-[var(--color-surface-subtle)]">
                  <td className="px-4 py-2 text-[var(--color-text-primary)]">{theme.name}</td>
                  <td className="px-4 py-2 font-mono text-xs text-[var(--color-text-secondary)]">{theme.slug}</td>
                  <td className="px-4 py-2 font-mono text-xs text-[var(--color-text-secondary)]">
                    {theme.installed_ref ?? '—'}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-[var(--color-text-secondary)]">
                    {theme.latest_ref ?? '—'}
                    {theme.latest_ref && theme.installed_ref && theme.latest_ref !== theme.installed_ref && (
                      <span className="ml-1 text-[var(--color-warning)] font-semibold">↑</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-[var(--color-text-secondary)]">
                    {theme.is_builtin ? 'built-in' : 'runtime'}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2 justify-end">
                      {!theme.is_builtin && (
                        <>
                          <button
                            disabled={busy === theme.slug}
                            onClick={() => handleCheck(theme.slug)}
                            className="px-2 py-1 text-xs border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-overlay)] disabled:opacity-50 transition-colors"
                          >
                            Check
                          </button>
                          <button
                            disabled={busy === theme.slug}
                            onClick={() => handleDelete(theme.slug)}
                            className="px-2 py-1 text-xs border border-[var(--color-error)] text-[var(--color-error)] rounded hover:bg-[var(--color-error)] hover:text-white disabled:opacity-50 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import {
  listAdminSessions,
  expireSession,
  deleteAdminSession,
  purgeExpiredSessions,
  PaginatedSessions,
  AdminSession,
} from '@/services/admin'

export default function Sessions() {
  const [data, setData] = useState<PaginatedSessions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [inputQ, setInputQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const perPage = 20

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await listAdminSessions({ page, per_page: perPage, q }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }, [page, q])

  useEffect(() => { load() }, [load])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setQ(inputQ)
  }

  async function handleExpire(session: AdminSession) {
    if (!confirm(`Force-expire session ${session.id.slice(0, 8)}…?`)) return
    setBusy(session.id)
    try {
      await expireSession(session.id)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(null)
    }
  }

  async function handleDelete(session: AdminSession) {
    if (!confirm(`Delete session ${session.id.slice(0, 8)}…? This is irreversible.`)) return
    setBusy(session.id)
    try {
      await deleteAdminSession(session.id)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(null)
    }
  }

  async function handlePurge() {
    if (!confirm('Purge all expired sessions? This is irreversible.')) return
    try {
      const res = await purgeExpiredSessions()
      alert(`Purged ${res.deleted_count} session(s)`)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Purge failed')
    }
  }

  const totalPages = data ? Math.ceil(data.total_items / perPage) : 1

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Sessions</h1>
        <button
          onClick={handlePurge}
          className="px-3 py-1.5 text-xs border border-[var(--color-error)] text-[var(--color-error)] rounded hover:bg-[var(--color-error)] hover:text-white transition-colors"
        >
          Purge Expired
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by session ID prefix…"
          value={inputQ}
          onChange={(e) => setInputQ(e.target.value)}
          className="flex-1 px-3 py-1.5 text-sm border border-[var(--color-border)] rounded bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
        <button
          type="submit"
          className="px-3 py-1.5 text-sm bg-[var(--color-surface-overlay)] border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-subtle)] transition-colors"
        >
          Search
        </button>
      </form>

      {error && <p className="text-sm text-[var(--color-error)] mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-[var(--color-text-secondary)]">Loading…</p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">No sessions found.</p>
      ) : (
        <>
          <div className="border border-[var(--color-border)] rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface-subtle)]">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-[var(--color-text-secondary)]">ID</th>
                  <th className="px-4 py-2 text-left font-medium text-[var(--color-text-secondary)]">Expires</th>
                  <th className="px-4 py-2 text-left font-medium text-[var(--color-text-secondary)]">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-[var(--color-text-secondary)]">Created</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {data.items.map((session) => (
                  <tr key={session.id} className="hover:bg-[var(--color-surface-subtle)]">
                    <td className="px-4 py-2 font-mono text-xs text-[var(--color-text-primary)]">
                      {session.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-2 text-xs text-[var(--color-text-secondary)]">
                      {new Date(session.expires_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          session.is_expired
                            ? 'text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-600'
                            : 'text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-700'
                        }
                      >
                        {session.is_expired ? 'expired' : 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-[var(--color-text-secondary)]">
                      {new Date(session.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2 justify-end">
                        {!session.is_expired && (
                          <button
                            disabled={busy === session.id}
                            onClick={() => handleExpire(session)}
                            className="px-2 py-1 text-xs border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-overlay)] disabled:opacity-50 transition-colors"
                          >
                            Expire
                          </button>
                        )}
                        <button
                          disabled={busy === session.id}
                          onClick={() => handleDelete(session)}
                          className="px-2 py-1 text-xs border border-[var(--color-error)] text-[var(--color-error)] rounded hover:bg-[var(--color-error)] hover:text-white disabled:opacity-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
            <span>
              {data.total_items} session{data.total_items !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2 py-1 border border-[var(--color-border)] rounded disabled:opacity-40 hover:bg-[var(--color-surface-subtle)] transition-colors"
              >
                ←
              </button>
              <span className="px-2 py-1">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 border border-[var(--color-border)] rounded disabled:opacity-40 hover:bg-[var(--color-surface-subtle)] transition-colors"
              >
                →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

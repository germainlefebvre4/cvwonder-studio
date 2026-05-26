import { useEffect, useState, useCallback, useRef } from 'react'
import {
  listAdminSessions,
  expireSession,
  deleteAdminSession,
  purgeExpiredSessions,
  PaginatedSessions,
} from '@/services/admin'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PersonIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons'

export default function Sessions() {
  const [data, setData] = useState<PaginatedSessions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [inputQ, setInputQ] = useState('')
  const [purgeResult, setPurgeResult] = useState<number | null>(null)
  const purgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  useEffect(() => () => {
    if (purgeTimerRef.current) clearTimeout(purgeTimerRef.current)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setQ(inputQ)
  }

  function clearSearch() {
    setQ('')
    setInputQ('')
    setPage(1)
  }

  function showPurgeResult(count: number) {
    setPurgeResult(count)
    setError('')
    if (purgeTimerRef.current) clearTimeout(purgeTimerRef.current)
    purgeTimerRef.current = setTimeout(() => setPurgeResult(null), 4000)
  }

  const totalPages = data ? Math.ceil(data.total_items / perPage) : 1
  const isEmpty = !loading && (!data || data.items.length === 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Sessions</h1>
        <ConfirmDialog
          title="Purge expired sessions"
          description="All expired sessions will be permanently deleted. This action is irreversible."
          confirmLabel="Purge all"
          variant="danger"
          onConfirm={async () => {
            const res = await purgeExpiredSessions()
            showPurgeResult(res.deleted_count)
            await load()
          }}
        >
          <button className="px-3 py-1.5 text-xs border border-[var(--color-error)] text-[var(--color-error)] rounded hover:bg-[var(--color-error)] hover:text-white transition-colors">
            Purge Expired
          </button>
        </ConfirmDialog>
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
      {purgeResult !== null && (
        <p className="text-sm text-[var(--color-success-text)] mb-4">
          {purgeResult} session{purgeResult !== 1 ? 's' : ''} purged.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-[var(--color-text-secondary)]">Loading…</p>
      ) : isEmpty ? (
        q ? (
          <div className="flex flex-col items-center gap-3 py-16 text-[var(--color-text-muted)]">
            <MagnifyingGlassIcon width={28} height={28} />
            <p className="text-sm">No sessions match '{q}'</p>
            <button
              onClick={clearSearch}
              className="text-xs text-[var(--color-accent-text)] hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-[var(--color-text-muted)]">
            <PersonIcon width={28} height={28} />
            <p className="text-sm">No sessions yet</p>
          </div>
        )
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
                {data!.items.map((session) => (
                  <tr key={session.id} className="hover:bg-[var(--color-surface-subtle)]">
                    <td className="px-4 py-2 font-mono text-xs text-[var(--color-text-primary)]">
                      {session.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-2 text-xs text-[var(--color-text-secondary)]">
                      {new Date(session.expires_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={session.is_expired ? 'error' : 'success'}>
                        {session.is_expired ? 'expired' : 'active'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-xs text-[var(--color-text-secondary)]">
                      {new Date(session.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2 justify-end">
                        {!session.is_expired && (
                          <ConfirmDialog
                            title="Force-expire session"
                            description={`Session ${session.id.slice(0, 8)}… will be marked as expired immediately.`}
                            confirmLabel="Expire"
                            variant="primary"
                            onConfirm={async () => {
                              await expireSession(session.id)
                              await load()
                            }}
                          >
                            <button className="px-2 py-1 text-xs border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-overlay)] transition-colors">
                              Expire
                            </button>
                          </ConfirmDialog>
                        )}
                        <ConfirmDialog
                          title="Delete session"
                          description={`Session ${session.id.slice(0, 8)}… will be permanently deleted. This is irreversible.`}
                          confirmLabel="Delete"
                          variant="danger"
                          onConfirm={async () => {
                            await deleteAdminSession(session.id)
                            await load()
                          }}
                        >
                          <button className="px-2 py-1 text-xs border border-[var(--color-error)] text-[var(--color-error)] rounded hover:bg-[var(--color-error)] hover:text-white transition-colors">
                            Delete
                          </button>
                        </ConfirmDialog>
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
              {data!.total_items} session{data!.total_items !== 1 ? 's' : ''}
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

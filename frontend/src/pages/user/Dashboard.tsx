import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/user'
import { listSessions, SessionListResponse, exportAccount, deleteAccount } from '@/services/user'
import SessionList from '@/components/user/SessionList'
import UserHeader from '@/components/user/UserHeader'
import TagFilter from '@/components/user/TagFilter'

export default function DashboardPage() {
  const { user } = useUserStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const [data, setData] = useState<SessionListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listSessions(tab === 'archived')
      setData(result)
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    fetchSessions()
    // After login, clear anon token (task 14.2)
    localStorage.removeItem('anon_session_token')
  }, [fetchSessions])

  const allTags = Array.from(
    new Set((data?.sessions ?? []).flatMap((s) => s.tags)),
  ).sort()

  const filtered =
    selectedTags.length === 0
      ? (data?.sessions ?? [])
      : (data?.sessions ?? []).filter((s) =>
          selectedTags.every((t) => s.tags.includes(t)),
        )

  const quota = data ? `${data.active} / ${data.max}` : '—'
  const quotaPercent = data ? Math.round((data.active / data.max) * 100) : 0
  const quotaFull = data ? data.active >= data.max : false

  async function handleExportAccount() {
    try {
      const blob = await exportAccount()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'cvwonder-account-export.zip'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Erreur lors de l\'export des données')
    }
  }

  async function handleDeleteAccount() {
    if (
      !confirm(
        '⚠️ Supprimer définitivement votre compte et toutes vos sessions ? Cette action est irréversible.',
      )
    )
      return
    try {
      await deleteAccount()
      useUserStore.getState().setUser(null)
      navigate('/')
    } catch (e) {
      alert('Erreur lors de la suppression du compte')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)] flex flex-col">
      <header className="bg-[var(--color-surface-default)] border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <a href="/" className="font-bold text-[var(--color-text-primary)]">CVWonder Studio</a>
          <span className="flex-1" />
          <UserHeader />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Mes sessions</h1>
          <div className="flex gap-2">
            <a
              href="/account"
              className="text-sm px-3 py-1.5 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]"
            >
              Mon compte
            </a>
            {!quotaFull && (
              <a
                href="/"
                className="text-sm px-3 py-1.5 bg-[var(--color-accent)] text-[var(--color-text-inverse)] rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-hover)]"
              >
                + Nouvelle session
              </a>
            )}
          </div>
        </div>

        {/* Quota banner */}
        <div className="bg-[var(--color-surface-default)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span>Sessions actives</span>
              <span className={quotaFull ? 'text-[var(--color-error-text)] font-medium' : 'text-[var(--color-text-secondary)]'}>
                {quota}
              </span>
            </div>
            <div className="w-full bg-[var(--color-surface-overlay)] rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${quotaFull ? 'bg-[var(--color-error)]' : 'bg-[var(--color-accent)]'}`}
                style={{ width: `${Math.min(quotaPercent, 100)}%` }}
              />
            </div>
          </div>
          {quotaFull && (
            <p className="text-xs text-[var(--color-error-text)] max-w-xs">
              Quota atteint. Archivez ou supprimez des sessions pour en créer de nouvelles.
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-[var(--color-border)]">
          <button
            onClick={() => setTab('active')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'active'
                ? 'border-[var(--color-accent)] text-[var(--color-accent-text)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            Actives
          </button>
          <button
            onClick={() => setTab('archived')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'archived'
                ? 'border-[var(--color-accent)] text-[var(--color-accent-text)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            Archivées
          </button>
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <TagFilter
            tags={allTags}
            selected={selectedTags}
            onChange={setSelectedTags}
          />
        )}

        {loading ? (
          <div className="text-[var(--color-text-muted)] text-sm">Chargement…</div>
        ) : (
          <SessionList
            sessions={filtered}
            onRefresh={fetchSessions}
            isArchived={tab === 'archived'}
            emptyMessage={
              tab === 'archived'
                ? 'Aucune session archivée.'
                : 'Aucune session active. Créez-en une !'
            }
          />
        )}
      </main>
    </div>
  )
}

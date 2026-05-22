import { useEffect, useState } from 'react'
import { getDashboard, DashboardStats } from '@/services/admin'

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-surface-default)]">
      <p className="text-xs text-[var(--color-text-secondary)] mb-1">{label}</p>
      <p className="text-2xl font-semibold text-[var(--color-text-primary)]">{value}</p>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboard()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Dashboard</h1>

      {error && <p className="text-sm text-[var(--color-error)] mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-[var(--color-text-secondary)]">Loading…</p>
      ) : stats ? (
        <div className="space-y-6">
          <section>
            <h2 className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
              Sessions
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="Active" value={stats.sessions.active} />
              <StatCard label="Expiring within 24h" value={stats.sessions.expiring_soon} />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
              Themes
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Total" value={stats.themes.total} />
              <StatCard label="Built-in" value={stats.themes.builtin} />
              <StatCard label="Runtime" value={stats.themes.runtime} />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
              System
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="Binary Version" value={stats.system.binary_version} />
              <StatCard label="Themes Storage" value={formatBytes(stats.system.themes_storage_bytes)} />
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

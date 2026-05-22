import { useEffect, useState } from 'react'
import { getSystemHealth, SystemHealth } from '@/services/admin'

function StatusBadge({ value }: { value: string }) {
  const ok = value === 'ok'
  return (
    <span
      className={
        ok
          ? 'text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700'
          : 'text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600'
      }
    >
      {value}
    </span>
  )
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-0">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      <StatusBadge value={value} />
    </div>
  )
}

export default function System() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    getSystemHealth()
      .then(setHealth)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load health'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">System Health</h1>
        <button
          onClick={load}
          className="px-3 py-1.5 text-xs border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-subtle)] transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-[var(--color-error)] mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-[var(--color-text-secondary)]">Loading…</p>
      ) : health ? (
        <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-default)] divide-y divide-[var(--color-border)]">
          <div className="px-4">
            <HealthRow label="Overall" value={health.status} />
          </div>
          <div className="px-4">
            <HealthRow label="Database" value={health.db} />
          </div>
          <div className="px-4">
            <HealthRow label="CVWonder binary" value={health.binary} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

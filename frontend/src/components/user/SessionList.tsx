import { UserSession } from '@/services/user'
import SessionCard from './SessionCard'

interface Props {
  sessions: UserSession[]
  onRefresh: () => void
  isArchived?: boolean
  emptyMessage?: string
}

export default function SessionList({ sessions, onRefresh, isArchived = false, emptyMessage }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="text-center text-[var(--color-text-muted)] py-12 text-sm">
        {emptyMessage ?? 'Aucune session trouvée.'}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sessions.map((s) => (
        <SessionCard key={s.id} session={s} onRefresh={onRefresh} isArchived={isArchived} />
      ))}
    </div>
  )
}

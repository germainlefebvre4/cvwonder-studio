import { UserSession } from '@/services/user'

/**
 * Returns the border status for a session card.
 * Priority: expiring soon > shared > default
 */
export function getSessionBorderStatus(session: UserSession): 'expiring' | 'shared' | 'default' {
  const diffMs = new Date(session.expires_at).getTime() - Date.now()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays <= 30) return 'expiring'
  if (session.share_token_hash !== null) return 'shared'
  return 'default'
}

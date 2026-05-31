import { UserSession } from '@/services/user'

/**
 * Returns the border status for a session card.
 * Priority: expiring soon > shared > default
 */
export function getSessionBorderStatus(session: UserSession): 'expiring' | 'shared' | 'default' {
  const diffMs = new Date(session.expires_at).getTime() - Date.now()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays <= 7) return 'expiring'
  if (session.has_share_token) return 'shared'
  return 'default'
}

/**
 * Returns true if the session has a share link that has expired.
 */
export function isShareExpired(session: UserSession): boolean {
  return (
    session.has_share_token &&
    session.share_expires_at !== null &&
    new Date(session.share_expires_at) < new Date()
  )
}

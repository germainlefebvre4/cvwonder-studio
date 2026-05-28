/**
 * Formats a date as a relative string in French.
 * e.g. "dans 8 mois", "dans 3 jours", "aujourd'hui", "il y a 2j"
 */
export function formatRelativeDate(iso: string | null | undefined): string {
  if (!iso) return '-'
  const now = new Date()
  const date = new Date(iso)
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "aujourd'hui"
  if (diffDays === 1) return 'demain'
  if (diffDays === -1) return 'il y a 1j'

  if (diffDays > 0) {
    if (diffDays >= 60) {
      const months = Math.round(diffDays / 30)
      return `dans ${months} mois`
    }
    return `dans ${diffDays} jours`
  }

  // Past
  const absDays = Math.abs(diffDays)
  if (absDays >= 60) {
    const months = Math.round(absDays / 30)
    return `il y a ${months} mois`
  }
  return `il y a ${absDays}j`
}

/**
 * Returns CSS color class suffix for expiry urgency.
 * Used to colorize the expiry date text.
 */
export function getExpiryUrgency(iso: string | null | undefined): 'muted' | 'warning' | 'error' {
  if (!iso) return 'muted'
  const diffMs = new Date(iso).getTime() - Date.now()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays < 0) return 'error'
  if (diffDays <= 30) return 'warning'
  return 'muted'
}

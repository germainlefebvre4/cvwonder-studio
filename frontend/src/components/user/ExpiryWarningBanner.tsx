import { useEffect, useState } from 'react'
import { getConfigLimits } from '@/services/user'

interface Props {
  expiresAt: string
  isAuthenticated: boolean
}

function hoursRemaining(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return diff / (1000 * 60 * 60)
}

export default function ExpiryWarningBanner({ expiresAt, isAuthenticated }: Props) {
  const [warn1, setWarn1] = useState(2)
  const [warn2, setWarn2] = useState(0.5)

  useEffect(() => {
    getConfigLimits()
      .then((l) => {
        setWarn1(l.anon_expiry_warn_1_hours)
        setWarn2(l.anon_expiry_warn_2_hours)
      })
      .catch(() => {})
  }, [])

  if (isAuthenticated) return null

  const hours = hoursRemaining(expiresAt)
  if (hours > warn1) return null

  const isUrgent = hours <= warn2
  const label = isUrgent
    ? `⚠️ Votre session expire dans moins de ${Math.round(warn2 * 60)} minutes !`
    : `⏰ Votre session expire dans moins de ${Math.round(hours * 60)} minutes.`

  return (
    <div
      className={`px-4 py-2 text-sm text-center font-medium ${
        isUrgent ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
      }`}
    >
      {label}{' '}
      <a href="/login" className="underline font-bold">
        Connectez-vous pour sauvegarder.
      </a>
    </div>
  )
}

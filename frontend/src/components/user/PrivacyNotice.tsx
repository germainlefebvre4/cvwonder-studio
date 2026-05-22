import { useEffect, useState } from 'react'
import { getConfigLimits } from '@/services/user'
import { useUserStore } from '@/store/user'

export default function PrivacyNotice() {
  const { isAuthenticated } = useUserStore()
  const [ttlHours, setTtlHours] = useState(24)

  useEffect(() => {
    getConfigLimits()
      .then((l) => setTtlHours(l.anon_session_ttl_hours))
      .catch(() => {})
  }, [])

  return (
    <p className="text-xs text-gray-400 text-center py-2 px-4">
      {isAuthenticated
        ? 'Vos sessions sont sauvegardées dans votre compte. Vous pouvez les retrouver depuis votre tableau de bord.'
        : `Session anonyme : votre YAML est conservé ${ttlHours}h. Connectez-vous pour ne plus perdre vos données.`}
    </p>
  )
}

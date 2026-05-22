import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getDashboard } from '@/services/admin'

interface RequireAdminProps {
  children: React.ReactNode
}

export default function RequireAdmin({ children }: RequireAdminProps) {
  const location = useLocation()
  const [status, setStatus] = useState<'loading' | 'ok' | 'unauthorized'>('loading')

  useEffect(() => {
    getDashboard()
      .then(() => setStatus('ok'))
      .catch(() => setStatus('unauthorized'))
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen text-[var(--color-text-secondary)]">
        Loading…
      </div>
    )
  }

  if (status === 'unauthorized') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useUserStore } from '@/store/user'

interface Props {
  children: ReactNode
}

/**
 * Guard component that redirects unauthenticated users to /login.
 * While the auth state is loading, renders nothing to avoid flash.
 */
export default function RequireUser({ children }: Props) {
  const { isAuthenticated, isLoading } = useUserStore()

  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

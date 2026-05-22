import { useEffect } from 'react'
import { getCurrentUser } from '@/services/user'
import { useUserStore } from '@/store/user'

/**
 * Fetches the current user profile on mount and populates the user store.
 * Should be called once near the top of the app tree.
 */
export function useCurrentUser() {
  const { setUser, setLoading } = useUserStore()

  useEffect(() => {
    setLoading(true)
    getCurrentUser()
      .then((user) => setUser(user))
      .catch(() => setUser(null))
  }, [setUser, setLoading])
}

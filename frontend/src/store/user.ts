import { create } from 'zustand'
import { User, logout as apiLogout } from '@/services/user'

interface UserState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (v: boolean) => void
  logout: () => Promise<void>
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: user !== null, isLoading: false }),
  setLoading: (v) => set({ isLoading: v }),
  logout: async () => {
    await apiLogout()
    // Clear anon session token on logout too.
    localStorage.removeItem('anon_session_token')
    set({ user: null, isAuthenticated: false })
  },
}))

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUserStore } from '@/store/user'

// Mock the logout API call so store tests don't hit the network.
vi.mock('@/services/user', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/user')>()
  return {
    ...actual,
    logout: vi.fn().mockResolvedValue(undefined),
  }
})

describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.setState({ user: null, isAuthenticated: false, isLoading: true })
  })

  it('starts with no user and isLoading=true', () => {
    const { user, isAuthenticated, isLoading } = useUserStore.getState()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
    expect(isLoading).toBe(true)
  })

  it('setUser with a user marks isAuthenticated=true and isLoading=false', () => {
    const fakeUser = {
      id: 'u1',
      email: 'test@example.com',
      name: 'Test',
      avatar_url: '',
      default_theme_id: null,
      created_at: new Date().toISOString(),
    }
    useUserStore.getState().setUser(fakeUser)
    const { user, isAuthenticated, isLoading } = useUserStore.getState()
    expect(user).toEqual(fakeUser)
    expect(isAuthenticated).toBe(true)
    expect(isLoading).toBe(false)
  })

  it('setUser with null marks isAuthenticated=false', () => {
    useUserStore.getState().setUser(null)
    const { user, isAuthenticated } = useUserStore.getState()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
  })

  it('logout clears user state', async () => {
    useUserStore.setState({ user: { id: 'u1', email: 'x', name: 'X', avatar_url: '', default_theme_id: null, created_at: '' }, isAuthenticated: true })
    await useUserStore.getState().logout()
    const { user, isAuthenticated } = useUserStore.getState()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
  })
})

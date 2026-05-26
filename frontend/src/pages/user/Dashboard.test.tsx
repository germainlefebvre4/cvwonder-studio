import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { useUserStore } from '@/store/user'
import DashboardPage from './Dashboard'

// Stub child components that pull in heavy dependencies.
vi.mock('@/components/user/SessionList', () => ({
  default: () => <div data-testid="session-list" />,
}))
vi.mock('@/components/user/UserHeader', () => ({
  default: () => <div data-testid="user-header" />,
}))
vi.mock('@/components/user/TagFilter', () => ({
  default: () => <div data-testid="tag-filter" />,
}))

const fakeUser = {
  id: 'u1',
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: '',
  default_theme_id: null,
  created_at: new Date().toISOString(),
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

describe('DashboardPage — quota logic', () => {
  beforeEach(() => {
    useUserStore.setState({ user: fakeUser, isAuthenticated: true, isLoading: false })
  })

  it('shows "Nouvelle session" link when quota not full', async () => {
    server.use(
      http.get('/api/sessions', () =>
        HttpResponse.json({ sessions: [], total: 0, active: 1, max: 3 }),
      ),
    )

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('+ Nouvelle session')).toBeInTheDocument()
    })
  })

  it('hides "Nouvelle session" link when quota is full', async () => {
    server.use(
      http.get('/api/sessions', () =>
        HttpResponse.json({ sessions: [], total: 0, active: 3, max: 3 }),
      ),
    )

    renderDashboard()

    await waitFor(() => {
      expect(screen.queryByText('+ Nouvelle session')).not.toBeInTheDocument()
    })
  })

  it('shows quota fraction in the banner', async () => {
    server.use(
      http.get('/api/sessions', () =>
        HttpResponse.json({ sessions: [], total: 0, active: 2, max: 5 }),
      ),
    )

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('2 / 5')).toBeInTheDocument()
    })
  })
})

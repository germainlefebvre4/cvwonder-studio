import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useUserStore } from '@/store/user'
import LoginPage from './Login'

// Capture location.href changes instead of real navigation.
const hrefSetter = vi.fn()
beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: { href: '' },
    writable: true,
    configurable: true,
  })
  Object.defineProperty(window.location, 'href', {
    set: hrefSetter,
    get: () => '',
    configurable: true,
  })
  useUserStore.setState({ user: null, isAuthenticated: false, isLoading: false })
  localStorage.removeItem('anon_session_token')
})

afterEach(() => {
  hrefSetter.mockReset()
})

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('redirects to plain login URL when no anon token in localStorage', () => {
    renderLogin()

    fireEvent.click(screen.getByText('Se connecter avec Google'))

    expect(hrefSetter).toHaveBeenCalledWith('/api/auth/login')
  })

  it('appends anon token to login URL when present in localStorage', () => {
    localStorage.setItem('anon_session_token', 'my-anon-token')

    renderLogin()

    fireEvent.click(screen.getByText('Se connecter avec Google'))

    expect(hrefSetter).toHaveBeenCalledWith(
      '/api/auth/login?anon_tok=my-anon-token',
    )
  })
})

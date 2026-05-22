import { NavLink, useNavigate } from 'react-router-dom'
import { adminLogout } from '@/services/admin'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/themes', label: 'Themes' },
  { to: '/admin/sessions', label: 'Sessions' },
  { to: '/admin/system', label: 'System' },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate()

  async function handleLogout() {
    await adminLogout().catch(() => {})
    navigate('/admin/login')
  }

  return (
    <div className="flex h-screen bg-[var(--color-surface-default)]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-[var(--color-border)] flex flex-col">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            CVWonder Admin
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'block px-3 py-2 rounded text-sm transition-colors',
                  isActive
                    ? 'bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] font-medium'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-[var(--color-border)]">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-left text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)] rounded transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}

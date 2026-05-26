import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDownIcon, DashboardIcon, PersonIcon, ExitIcon } from '@radix-ui/react-icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/user'

export default function UserHeader() {
  const { user, logout } = useUserStore()
  const location = useLocation()
  const navigate = useNavigate()

  if (!user) return null

  const onDashboard = location.pathname === '/dashboard'
  const onAccount = location.pathname === '/account'

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-muted)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-7 h-7 rounded-full border border-[var(--color-border)] flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[var(--color-surface-muted)] border border-[var(--color-border)] flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium hidden sm:block">{user.name}</span>
          <ChevronDownIcon className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[200px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-default)] shadow-lg py-1 animate-in fade-in-0 zoom-in-95"
        >
          {/* Email header */}
          <div className="px-3 py-2 border-b border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] truncate">{user.email}</p>
          </div>

          <div className="py-1">
            <DropdownMenu.Item
              disabled={onDashboard}
              onSelect={() => navigate('/dashboard')}
              className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer select-none outline-none
                text-[var(--color-text-primary)]
                data-[highlighted]:bg-[var(--color-surface-muted)]
                data-[disabled]:opacity-40 data-[disabled]:cursor-default data-[disabled]:pointer-events-none"
            >
              <DashboardIcon className="w-4 h-4 flex-shrink-0" />
              Mon dashboard
            </DropdownMenu.Item>

            <DropdownMenu.Item
              disabled={onAccount}
              onSelect={() => navigate('/account')}
              className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer select-none outline-none
                text-[var(--color-text-primary)]
                data-[highlighted]:bg-[var(--color-surface-muted)]
                data-[disabled]:opacity-40 data-[disabled]:cursor-default data-[disabled]:pointer-events-none"
            >
              <PersonIcon className="w-4 h-4 flex-shrink-0" />
              Mon compte
            </DropdownMenu.Item>
          </div>

          <DropdownMenu.Separator className="h-px bg-[var(--color-border)] mx-1" />

          <div className="py-1">
            <DropdownMenu.Item
              onSelect={logout}
              className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer select-none outline-none
                text-[var(--color-error)]
                data-[highlighted]:bg-[var(--color-surface-muted)]"
            >
              <ExitIcon className="w-4 h-4 flex-shrink-0" />
              Déconnexion
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

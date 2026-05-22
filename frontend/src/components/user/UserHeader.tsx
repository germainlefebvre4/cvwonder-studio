import { useUserStore } from '@/store/user'

/**
 * UserHeader — displays the user's avatar, name, email, and a logout button.
 * Shown in the global layout when the user is authenticated.
 */
export default function UserHeader() {
  const { user, logout } = useUserStore()
  if (!user) return null

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.name}
          className="w-8 h-8 rounded-full border"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-medium">{user.name}</span>
        <span className="text-xs text-gray-500">{user.email}</span>
      </div>
      <button
        onClick={logout}
        className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors"
      >
        Déconnexion
      </button>
    </div>
  )
}

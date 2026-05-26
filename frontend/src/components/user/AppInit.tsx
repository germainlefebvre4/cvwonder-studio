import { useCurrentUser } from '@/hooks/useCurrentUser'

/**
 * AppInit - mounts at the top of the app tree to load the current user.
 * Returns null (renders nothing), purely a side-effect component.
 */
export default function AppInit() {
  useCurrentUser()
  return null
}

import { useSyncExternalStore } from 'react'
import {
  getState,
  subscribe,
  currentUser,
  currentTenant,
  roleInTenant,
  membershipsForUser,
} from './store'
import type { MembershipRole, Tenant, User } from './types'

export function useAppState() {
  return useSyncExternalStore(subscribe, getState, getState)
}

export function useSession(): {
  user: User | null
  tenant: Tenant | null
  role: MembershipRole | null
  memberships: ReturnType<typeof membershipsForUser>
} {
  useAppState()
  const user = currentUser()
  const tenant = currentTenant()
  const role = user && tenant ? roleInTenant(user.id, tenant.id) || null : null
  const memberships = user ? membershipsForUser(user.id) : []
  return { user, tenant, role, memberships }
}

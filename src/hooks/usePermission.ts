import { useMemo } from 'react'

import { useAuthStore } from '@/stores/authStore'
import { hasAllPermissions, hasAnyPermission, hasPermission } from '@/services/auth.service'

/**
 * Bound permission checks for the current user.
 *
 * Thin binding over the single source of truth ({@link useAuthStore} `permissions` slice) and the
 * pure check functions in `auth.service.ts`. It does NOT reimplement `includes` logic and does NOT
 * introduce a second permission store — it only supplies the current user's permission array as the
 * first argument so pages stop hand-rolling `permissions.includes(...)`.
 *
 * Backend `@PreAuthorize` remains the real security gate; this only drives what the UI shows/enables.
 *
 * @example
 * const { can, canAny } = usePermission()
 * const canCreate = can('classifiers.edit')
 * if (canAny(['users.create', 'users.manage'])) { ... }
 */
export interface UsePermissionResult {
  /** Raw permission slice — for the rare case a caller needs the array directly. */
  permissions: string[]
  /** True if the user holds the single permission. */
  can: (permission: string) => boolean
  /** True if the user holds at least one of the permissions. */
  canAny: (permissions: string[]) => boolean
  /** True if the user holds every one of the permissions. */
  canAll: (permissions: string[]) => boolean
}

export function usePermission(): UsePermissionResult {
  const permissions = useAuthStore((s) => s.permissions)

  return useMemo(
    () => ({
      permissions,
      can: (permission: string) => hasPermission(permissions, permission),
      canAny: (required: string[]) => hasAnyPermission(permissions, required),
      canAll: (required: string[]) => hasAllPermissions(permissions, required),
    }),
    [permissions],
  )
}

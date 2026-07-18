import type { ReactNode } from 'react'

import { usePermission } from '@/hooks/usePermission'

/**
 * Declarative permission gate for UI fragments (buttons, actions, sections).
 *
 * Built exclusively on {@link usePermission} — the ONE permission binding. Renders {@link CanProps.children}
 * only when the check passes, otherwise {@link CanProps.fallback} (default nothing). Combine props with AND:
 * `permission` (single) AND `all` (every) AND `anyOf` (at least one).
 *
 * This is UX only — the backend `@PreAuthorize` is the real gate; hiding a button never blocks a crafted request.
 *
 * @example
 * <Can permission="classifiers.edit"><Button>Assign</Button></Can>
 * <Can anyOf={['users.create', 'users.manage']}><Button>New user</Button></Can>
 */
export interface CanProps {
  /** Single permission the user must hold. */
  permission?: string
  /** ALL of these permissions are required. */
  all?: string[]
  /** ANY one of these permissions is sufficient. */
  anyOf?: string[]
  /** Rendered when the check fails (default: nothing). */
  fallback?: ReactNode
  children: ReactNode
}

export function Can({ permission, all, anyOf, fallback = null, children }: CanProps) {
  const { can, canAny, canAll } = usePermission()

  const allowed =
    (permission ? can(permission) : true) &&
    (all ? canAll(all) : true) &&
    (anyOf ? canAny(anyOf) : true)

  return <>{allowed ? children : fallback}</>
}

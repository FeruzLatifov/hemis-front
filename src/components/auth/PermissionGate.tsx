/**
 * Permission Gate Component
 *
 * Conditionally renders children based on user permissions
 */

import { ReactNode } from 'react'
import { usePermissions } from '../../hooks/usePermissions'

interface PermissionGateProps {
  /** Permission code or array of permission codes */
  permission: string | string[]
  /** If true, requires ALL permissions; if false, requires ANY permission (default: false) */
  requireAll?: boolean
  /** Fallback component to render if permission check fails */
  fallback?: ReactNode
  /** Children to render if permission check passes */
  children: ReactNode
}

/**
 * Permission Gate Component
 *
 * Usage:
 * ```tsx
 * <PermissionGate permission="students.create">
 *   <Button>Talaba qo'shish</Button>
 * </PermissionGate>
 *
 * <PermissionGate
 *   permission={['students.delete', 'students.update']}
 *   requireAll
 *   fallback={<div>Ruxsat yo'q</div>}
 * >
 *   <Button>O'chirish</Button>
 * </PermissionGate>
 * ```
 */
export const PermissionGate = ({
  permission,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions()

  let allowed = false

  if (Array.isArray(permission)) {
    allowed = requireAll
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission)
  } else {
    allowed = hasPermission(permission)
  }

  if (!allowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/stores/authStore'
import { hasPermission } from '@/services/auth.service'
import ForbiddenPage from '@/pages/ForbiddenPage'
import { PageLoader } from '@/components/PageLoader'

/**
 * Route-level guard (the single, shared route guard — do not add siblings).
 *
 * - Not authenticated → redirect to /login (preserving the target for post-login return).
 * - Authenticated but missing `permission` → render {@link ForbiddenPage} in place (URL preserved),
 *   instead of a silent /dashboard redirect that hides the denial.
 * - Otherwise render the route.
 *
 * Reuses {@link hasPermission} so the route gate and button/`<Can>` gates share one check.
 * This is UX/navigation only — the backend `@PreAuthorize` is the real security boundary.
 */
export interface ProtectedRouteProps {
  children: ReactNode
  /** Permission code required to view this route (omit for auth-only routes). */
  permission?: string
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { isAuthenticated, permissions, isInitializing } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  }

  if (permission && !hasPermission(permissions, permission)) {
    // Permissions are refetched on every app start and are not persisted; while
    // that refetch is in flight, wait instead of flashing ForbiddenPage on a
    // reloaded deep-link to a gated route.
    if (isInitializing) {
      return <PageLoader />
    }
    return <ForbiddenPage />
  }

  return <>{children}</>
}

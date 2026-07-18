/**
 * Auth / permission UI primitives barrel.
 *
 * Import as: import { Can, ProtectedRoute } from '@/components/auth'
 *
 * One source of truth: useAuthStore.permissions + auth.service check functions →
 * usePermission() (hook) → Can (component) / ProtectedRoute (route guard). No parallel systems.
 */
export { Can, type CanProps } from './Can'
export { ProtectedRoute, type ProtectedRouteProps } from './ProtectedRoute'

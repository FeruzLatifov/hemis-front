/**
 * Permissions Hook
 *
 * Hook for checking user permissions (role-based access control)
 */

import { useAuthStore } from '../stores/authStore'

export const usePermissions = () => {
  const { permissions, user } = useAuthStore()

  /**
   * Check if user has a specific permission
   *
   * @param permission Permission code (e.g., "students.view", "teachers.create")
   * @returns true if user has the permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!permissions || permissions.length === 0) {
      return false
    }

    return permissions.includes(permission)
  }

  /**
   * Check if user has ANY of the specified permissions
   *
   * @param permissionList Array of permission codes
   * @returns true if user has at least one permission
   */
  const hasAnyPermission = (permissionList: string[]): boolean => {
    if (!permissions || permissions.length === 0) {
      return false
    }

    return permissionList.some((p) => permissions.includes(p))
  }

  /**
   * Check if user has ALL of the specified permissions
   *
   * @param permissionList Array of permission codes
   * @returns true if user has all permissions
   */
  const hasAllPermissions = (permissionList: string[]): boolean => {
    if (!permissions || permissions.length === 0) {
      return false
    }

    return permissionList.every((p) => permissions.includes(p))
  }

  /**
   * Check if user has a specific role
   *
   * Note: Backend JWT includes permissions (not roles)
   * This is a convenience function that checks for role-specific permissions
   *
   * @param role Role name (e.g., "SUPER_ADMIN", "UNIVERSITY_ADMIN")
   * @returns true if user has role-related permissions
   */
  const hasRole = (role: string): boolean => {
    // Common role patterns
    const rolePermissions: Record<string, string[]> = {
      SUPER_ADMIN: ['*', 'admin.*'],
      MINISTRY_ADMIN: ['ministry.*', 'reports.*'],
      UNIVERSITY_ADMIN: ['university.*', 'students.*', 'teachers.*'],
      VIEWER: ['*.view'],
    }

    const rolePerms = rolePermissions[role] || []
    if (rolePerms.length === 0) {
      return false
    }

    // Check if user has any of the role permissions
    return rolePerms.some((pattern) => {
      if (pattern === '*') {
        // Super admin check
        return permissions.includes('*') || permissions.includes('admin.*')
      }

      // Pattern matching (e.g., "students.*")
      if (pattern.endsWith('.*')) {
        const prefix = pattern.slice(0, -2)
        return permissions.some((p) => p.startsWith(prefix + '.'))
      }

      return permissions.includes(pattern)
    })
  }

  /**
   * Check if user is super admin (has all permissions)
   */
  const isSuperAdmin = (): boolean => {
    return hasPermission('*') || hasPermission('admin.*') || hasRole('SUPER_ADMIN')
  }

  /**
   * Get all user permissions
   */
  const getAllPermissions = (): string[] => {
    return permissions || []
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isSuperAdmin,
    getAllPermissions,
    user,
    permissions,
  }
}

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { usersApi } from '@/api/users.api'
import { queryKeys } from '@/lib/queryKeys'
import { CACHE } from '@/constants/cache'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import type {
  UsersParams,
  UserCreateRequest,
  UserUpdateRequest,
  ChangePasswordRequest,
} from '@/types/user.types'

/**
 * Hook to fetch paginated list of users
 */
export function useUsers(params: UsersParams = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => usersApi.getUsers(params, signal),
    placeholderData: keepPreviousData,
  })
}

/**
 * Hook to fetch a single user by ID
 */
export function useUserById(id: string) {
  return useQuery({
    queryKey: queryKeys.users.byId(id),
    queryFn: ({ signal }) => usersApi.getUserById(id, signal),
    enabled: !!id,
  })
}

/**
 * Hook to fetch active roles for dropdown
 */
export function useRoles() {
  return useQuery({
    queryKey: queryKeys.users.roles,
    queryFn: ({ signal }) => usersApi.getRoles(signal),
    staleTime: CACHE.MEDIUM,
  })
}

/**
 * Hook to fetch permissions for a specific role
 */
export function useRolePermissions(id: string) {
  return useQuery({
    queryKey: queryKeys.users.rolePermissions(id),
    queryFn: ({ signal }) => usersApi.getRolePermissions(id, signal),
    enabled: !!id,
  })
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UserCreateRequest) => usersApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      toast.success(i18n.t('User successfully created'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to create user')))
    },
  })
}

/**
 * Hook to update a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdateRequest }) =>
      usersApi.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.byId(variables.id) })
      toast.success(i18n.t('User successfully updated'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to update user')))
    },
  })
}

/**
 * Hook to change user password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChangePasswordRequest }) =>
      usersApi.changePassword(id, data),
    onSuccess: () => {
      toast.success(i18n.t('Password successfully changed'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to change password')))
    },
  })
}

/**
 * Hook to toggle user enabled/disabled status
 */
export function useToggleStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usersApi.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      toast.success(i18n.t('User status updated'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to update status')))
    },
  })
}

/**
 * Hook to unlock a locked user account
 */
export function useUnlockAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usersApi.unlockAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      toast.success(i18n.t('Account successfully unlocked'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to unlock account')))
    },
  })
}

/**
 * Hook to soft delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      toast.success(i18n.t('User successfully deleted'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to delete user')))
    },
  })
}

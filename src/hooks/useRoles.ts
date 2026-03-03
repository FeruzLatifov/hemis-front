import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { rolesApi } from '@/api/roles.api'
import { queryKeys } from '@/lib/queryKeys'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import type { RolesParams, RoleCreateRequest, RoleUpdateRequest } from '@/types/role.types'

export function useRolesList(params: RolesParams = {}) {
  return useQuery({
    queryKey: queryKeys.roles.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => rolesApi.getRoles(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useRoleById(id: string) {
  return useQuery({
    queryKey: queryKeys.roles.byId(id),
    queryFn: ({ signal }) => rolesApi.getRoleById(id, signal),
    enabled: !!id,
  })
}

export function useAllPermissions() {
  return useQuery({
    queryKey: queryKeys.roles.permissions,
    queryFn: ({ signal }) => rolesApi.getAllPermissions(signal),
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RoleCreateRequest) => rolesApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all })
      toast.success(i18n.t('Role successfully created'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to create role')))
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoleUpdateRequest }) =>
      rolesApi.updateRole(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.byId(variables.id) })
      toast.success(i18n.t('Role successfully updated'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to update role')))
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => rolesApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all })
      toast.success(i18n.t('Role successfully deleted'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to delete role')))
    },
  })
}

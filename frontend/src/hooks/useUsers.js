import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usersApi } from '../api/users'

// ── Self ──────────────────────────────────────────────────────────────────────
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.getMe().then((r) => r.data.data),
    staleTime: 60000,
  })
}

export function useUpdateMe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => usersApi.updateMe(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['me'] }); toast.success('Profile updated') },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data) => usersApi.changePassword(data),
    onSuccess: () => toast.success('Password changed'),
    onError: (e) => toast.error(e.response?.data?.message || 'Password change failed'),
  })
}

// ── Org ───────────────────────────────────────────────────────────────────────
export function useOrg() {
  return useQuery({
    queryKey: ['org'],
    queryFn: () => usersApi.getOrg().then((r) => r.data.data),
    staleTime: 60000,
  })
}

export function useUpdateOrg() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => usersApi.updateOrg(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['org'] }); toast.success('Organization updated') },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
  })
}

// ── Users (manager) ───────────────────────────────────────────────────────────
export function useUsers(params) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.listUsers(params).then((r) => r.data.data),
    refetchInterval: 30000,
  })
}

export function useChangeRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }) => usersApi.changeRole(id, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Role updated') },
    onError: (e) => toast.error(e.response?.data?.message || 'Role update failed'),
  })
}

export function useDeactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => usersApi.deactivateUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User deactivated') },
    onError: (e) => toast.error(e.response?.data?.message || 'Deactivation failed'),
  })
}

export function useReactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => usersApi.reactivateUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User reactivated') },
    onError: (e) => toast.error(e.response?.data?.message || 'Reactivation failed'),
  })
}

// ── Invites (manager) ─────────────────────────────────────────────────────────
export function useInvites(params) {
  return useQuery({
    queryKey: ['invites', params],
    queryFn: () => usersApi.listInvites(params).then((r) => r.data.data),
    refetchInterval: 30000,
  })
}

export function useSendInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => usersApi.sendInvite(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invites'] }); toast.success('Invite sent') },
    onError: (e) => toast.error(e.response?.data?.message || 'Invite failed'),
  })
}

export function useRevokeInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => usersApi.revokeInvite(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invites'] }); toast.success('Invite revoked') },
    onError: (e) => toast.error(e.response?.data?.message || 'Revoke failed'),
  })
}

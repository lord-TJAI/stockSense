import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useUsers, useChangeRole, useDeactivateUser, useReactivateUser,
  useInvites, useSendInvite, useRevokeInvite,
} from '../../hooks/useUsers'
import useAuthStore from '../../store/authStore'
import { cn } from '../../lib/utils'

const inviteSchema = z.object({
  email: z.string().email('Valid email required'),
  role:  z.enum(['inventory_manager', 'inventory_staff']),
})

const ROLE_LABELS = {
  inventory_manager: 'Manager',
  inventory_staff:   'Staff',
}

const ROLE_BADGE = {
  inventory_manager: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  inventory_staff:   'bg-stone-100   text-stone-600  dark:bg-stone-700       dark:text-stone-400',
}

function UserRow({ user, currentUserId, onChangeRole, onToggle }) {
  const [newRole, setNewRole] = useState(user.role)
  const isMe = user._id === currentUserId
  const isSelf = isMe

  return (
    <tr className="hover:bg-stone-50 dark:hover:bg-stone-700/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-semibold text-sm">
            {user.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-medium text-stone-800 dark:text-stone-200 text-sm">
              {user.name} {isMe && <span className="text-xs text-stone-400">(you)</span>}
            </p>
            <p className="text-xs text-stone-400">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', ROLE_BADGE[user.role])}>
          {ROLE_LABELS[user.role] ?? user.role}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
          user.isActive
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100   text-red-700   dark:bg-red-900/30   dark:text-red-400')}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-stone-400">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        {!isSelf && (
          <div className="flex items-center gap-2">
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
              className="text-xs px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 outline-none focus:ring-1 focus:ring-primary-500">
              <option value="inventory_manager">Manager</option>
              <option value="inventory_staff">Staff</option>
            </select>
            {newRole !== user.role && (
              <button onClick={() => { onChangeRole(user._id, newRole); setNewRole(user.role) }}
                className="text-xs px-2 py-1 rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors">
                Save
              </button>
            )}
            <button
              onClick={() => onToggle(user._id, user.isActive)}
              className={cn('text-xs hover:underline transition', user.isActive ? 'text-red-500' : 'text-green-600')}>
              {user.isActive ? 'Deactivate' : 'Reactivate'}
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

export default function UsersPage() {
  const currentUserId = useAuthStore((s) => s.user?._id)
  const isManager     = useAuthStore((s) => s.isManager())
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [activeTab, setActiveTab] = useState('members') // 'members' | 'invites'

  const { data: userData, isLoading: usersLoading } = useUsers({ search, page, limit: 20 })
  const { data: inviteData, isLoading: invitesLoading } = useInvites({ limit: 20 })

  const changeRole    = useChangeRole()
  const deactivate    = useDeactivateUser()
  const reactivate    = useReactivateUser()
  const sendInvite    = useSendInvite()
  const revokeInvite  = useRevokeInvite()

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'inventory_staff' },
  })

  const users   = userData?.users   || []
  const invites = inviteData?.invites || []

  function handleToggle(id, isActive) {
    if (isActive) {
      if (!window.confirm('Deactivate this user? Their sessions will be revoked immediately.')) return
      deactivate.mutate(id)
    } else {
      reactivate.mutate(id)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Team</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {userData?.pagination?.total ?? '…'} members
          </p>
        </div>
        {isManager && (
          <button onClick={() => setShowInviteForm(v => !v)}
            className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors">
            {showInviteForm ? 'Cancel' : '✉️ Invite member'}
          </button>
        )}
      </div>

      {/* Invite form */}
      {showInviteForm && isManager && (
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-5">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">Send invite</h2>
          <form onSubmit={handleSubmit((d) => sendInvite.mutate(d, { onSuccess: () => { reset(); setShowInviteForm(false) } }))}
            className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <input type="email" placeholder="colleague@example.com" {...register('email')}
                className={cn('w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-primary-500 transition',
                  errors.email ? 'border-red-500' : 'border-stone-300 dark:border-stone-600')} />
              {errors.email && <p className="mt-0.5 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <select {...register('role')}
              className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 text-sm bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-primary-500">
              <option value="inventory_staff">Staff</option>
              <option value="inventory_manager">Manager</option>
            </select>
            <button type="submit" disabled={sendInvite.isPending}
              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white text-sm font-medium transition-colors">
              {sendInvite.isPending ? 'Sending…' : 'Send invite'}
            </button>
          </form>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-stone-200 dark:border-stone-700">
        {[
          { id: 'members', label: `Members (${userData?.pagination?.total ?? '…'})` },
          { id: 'invites', label: `Pending invites (${inviteData?.pagination?.total ?? '…'})`, managerOnly: true },
        ].filter((t) => !t.managerOnly || isManager).map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300')}>
            {label}
          </button>
        ))}
      </div>

      {/* Members table */}
      {activeTab === 'members' && (
        <div className="space-y-3">
          <input type="search" placeholder="Search name or email…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full sm:w-72 px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 text-sm bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-primary-500 transition" />

          {usersLoading ? <div className="text-center py-12 text-stone-400">Loading…</div> : (
            <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-700">
                  <tr>
                    {['Member', 'Role', 'Status', 'Joined', isManager ? 'Actions' : ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-700/50">
                  {users.map((u) => (
                    <UserRow key={u._id} user={u} currentUserId={currentUserId}
                      onChangeRole={(id, role) => changeRole.mutate({ id, role })}
                      onToggle={handleToggle} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pending invites */}
      {activeTab === 'invites' && isManager && (
        <div>
          {invitesLoading ? <div className="text-center py-12 text-stone-400">Loading…</div> :
            invites.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <div className="text-4xl">✉️</div>
                <p className="text-stone-500 dark:text-stone-400">No pending invites</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 divide-y divide-stone-100 dark:divide-stone-700/50">
                {invites.map((inv) => (
                  <div key={inv._id} className="flex items-center justify-between px-5 py-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{inv.email}</p>
                      <p className="text-xs text-stone-400">
                        {ROLE_LABELS[inv.role]} · invited by {inv.invitedBy?.name ?? '—'} ·
                        expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button onClick={() => { if (window.confirm(`Revoke invite for ${inv.email}?`)) revokeInvite.mutate(inv._id) }}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline transition whitespace-nowrap">
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  )
}

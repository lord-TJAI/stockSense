import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useMe, useUpdateMe, useChangePassword,
  useOrg, useUpdateOrg,
} from '../../hooks/useUsers'
import useAuthStore from '../../store/authStore'
import { cn } from '../../lib/utils'

const profileSchema = z.object({ name: z.string().min(1, 'Name required').max(100) })

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword:     z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

const orgSchema = z.object({ name: z.string().min(1, 'Required').max(100) })

function SettingsCard({ title, description, children }) {
  return (
    <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-stone-800 dark:text-stone-200">{title}</h2>
        {description && <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputCls = (hasErr) => cn(
  'w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none transition focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
  hasErr ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'
)

export default function SettingsPage() {
  const isManager = useAuthStore((s) => s.isManager())
  const { data: me, isLoading: meLoading } = useMe()
  const { data: org, isLoading: orgLoading } = useOrg()

  const updateMe  = useUpdateMe()
  const changePwd = useChangePassword()
  const updateOrg = useUpdateOrg()

  // ── Profile form ─────────────────────────────────────────────────────────────
  const profileForm = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: '' } })
  useEffect(() => { if (me) profileForm.reset({ name: me.name }) }, [me])

  // ── Password form ─────────────────────────────────────────────────────────────
  const pwdForm = useForm({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } })

  // ── Org form ──────────────────────────────────────────────────────────────────
  const orgForm = useForm({ resolver: zodResolver(orgSchema), defaultValues: { name: '' } })
  useEffect(() => { if (org) orgForm.reset({ name: org.name }) }, [org])

  if (meLoading) return <div className="p-6 text-center text-stone-400">Loading…</div>

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Settings</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">Manage your profile and organization</p>
      </div>

      {/* ── Profile ── */}
      <SettingsCard title="Your profile" description="Update your display name">
        <form onSubmit={profileForm.handleSubmit((d) => updateMe.mutate(d))} noValidate className="space-y-4">
          <Field label="Full name" error={profileForm.formState.errors.name?.message}>
            <input type="text" {...profileForm.register('name')}
              className={inputCls(!!profileForm.formState.errors.name)} />
          </Field>
          <Field label="Email address">
            <input type="email" value={me?.email ?? ''} disabled
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 text-sm bg-stone-50 dark:bg-stone-900/50 text-stone-400 cursor-not-allowed" />
            <p className="mt-1 text-xs text-stone-400">Email cannot be changed after registration</p>
          </Field>
          <button type="submit" disabled={updateMe.isPending}
            className="px-5 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white text-sm font-medium transition-colors">
            {updateMe.isPending ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </SettingsCard>

      {/* ── Password ── */}
      <SettingsCard title="Change password" description="Choose a strong password of at least 8 characters">
        <form onSubmit={pwdForm.handleSubmit((d) => changePwd.mutate(d, { onSuccess: () => pwdForm.reset() }))}
          noValidate className="space-y-4">
          {[
            { name: 'currentPassword', label: 'Current password' },
            { name: 'newPassword',     label: 'New password' },
            { name: 'confirmPassword', label: 'Confirm new password' },
          ].map(({ name, label }) => (
            <Field key={name} label={label} error={pwdForm.formState.errors[name]?.message}>
              <input type="password" {...pwdForm.register(name)}
                autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
                className={inputCls(!!pwdForm.formState.errors[name])} />
            </Field>
          ))}
          <button type="submit" disabled={changePwd.isPending}
            className="px-5 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white text-sm font-medium transition-colors">
            {changePwd.isPending ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </SettingsCard>

      {/* ── Account meta ── */}
      <SettingsCard title="Account info">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Role',      value: me?.role === 'inventory_manager' ? '👑 Manager' : '👤 Staff' },
            { label: 'Verified',  value: me?.isEmailVerified ? '✅ Yes' : '❌ No' },
            { label: 'Member since', value: me?.createdAt ? new Date(me.createdAt).toLocaleDateString() : '—' },
            { label: 'Last login',   value: me?.lastLoginAt ? new Date(me.lastLoginAt).toLocaleString() : '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-0.5">{label}</p>
              <p className="font-medium text-stone-800 dark:text-stone-200">{value}</p>
            </div>
          ))}
        </div>
      </SettingsCard>

      {/* ── Organization (manager only) ── */}
      {isManager && (
        <SettingsCard title="Organization settings" description="Visible to all members in your org">
          {orgLoading ? <div className="text-stone-400 text-sm">Loading…</div> : (
            <form onSubmit={orgForm.handleSubmit((d) => updateOrg.mutate(d))} noValidate className="space-y-4">
              <Field label="Organization name" error={orgForm.formState.errors.name?.message}>
                <input type="text" {...orgForm.register('name')}
                  className={inputCls(!!orgForm.formState.errors.name)} />
              </Field>
              <div className="grid grid-cols-2 gap-4 text-sm text-stone-500 dark:text-stone-400">
                <div>
                  <p className="text-xs uppercase tracking-wide font-medium mb-0.5">Plan</p>
                  <p className="capitalize font-medium text-stone-700 dark:text-stone-300">{org?.plan ?? 'free'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide font-medium mb-0.5">Created</p>
                  <p className="font-medium text-stone-700 dark:text-stone-300">
                    {org?.createdAt ? new Date(org.createdAt).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
              <button type="submit" disabled={updateOrg.isPending}
                className="px-5 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white text-sm font-medium transition-colors">
                {updateOrg.isPending ? 'Saving…' : 'Save organization'}
              </button>
            </form>
          )}
        </SettingsCard>
      )}
    </div>
  )
}

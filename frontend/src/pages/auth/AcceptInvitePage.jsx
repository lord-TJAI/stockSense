import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useGetInvite, useAcceptInvite } from '../../hooks/useAuth'
import { cn } from '../../lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const ROLE_LABELS = {
  inventory_manager: 'Inventory Manager',
  warehouse_staff: 'Warehouse Staff',
}

export default function AcceptInvitePage() {
  const { token } = useParams()
  const { data: invite, isLoading, error } = useGetInvite(token)
  const acceptInvite = useAcceptInvite(token)
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-stone-400">Loading invitation…</div>
      </div>
    )
  }

  if (error) {
    const msg = error.response?.data?.message || 'This invitation is invalid or has expired.'
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">📭</div>
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-2">Invitation unavailable</h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">{msg}</p>
          <Link to="/login" className="text-primary-600 hover:underline text-sm">Back to login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
            <span className="text-white font-bold text-base">S</span>
          </div>
          <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">StockSense</span>
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-8">
          <div className="mb-6">
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 mb-3">
              {ROLE_LABELS[invite?.role]}
            </span>
            <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-1">
              Join {invite?.orgName}
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              You were invited as <strong>{invite?.email}</strong>. Set a password to accept.
            </p>
          </div>

          <form onSubmit={handleSubmit((data) => acceptInvite.mutate(data))} noValidate className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Your full name
              </label>
              <input id="name" type="text" autoComplete="name" {...register('name')}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none transition',
                  'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  errors.name ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'
                )}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500" role="alert">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Create a password
              </label>
              <input id="password" type="password" autoComplete="new-password" {...register('password')}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none transition',
                  'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  errors.password ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'
                )}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500" role="alert">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={acceptInvite.isPending}
              className="w-full py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
              {acceptInvite.isPending ? 'Joining…' : 'Accept invitation'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

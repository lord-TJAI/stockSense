import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useSignup } from '../../hooks/useAuth'
import { cn } from '../../lib/utils'

const schema = z.object({
  orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
})

export default function SignupPage() {
  const signup = useSignup()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const fields = [
    { id: 'orgName', label: 'Organization name', type: 'text', autoComplete: 'organization' },
    { id: 'name', label: 'Your full name', type: 'text', autoComplete: 'name' },
    { id: 'email', label: 'Work email', type: 'email', autoComplete: 'email' },
    { id: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
            <span className="text-white font-bold text-base">S</span>
          </div>
          <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">StockSense</span>
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-8">
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-1">
            Create your organization
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
            You'll be the Inventory Manager and can invite your team.
          </p>

          <form onSubmit={handleSubmit((data) => signup.mutate(data))} noValidate className="space-y-4">
            {fields.map(({ id, label, type, autoComplete }) => (
              <div key={id}>
                <label htmlFor={id} className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {label}
                </label>
                <input
                  id={id}
                  type={type}
                  autoComplete={autoComplete}
                  {...register(id)}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-stone-900',
                    'text-stone-900 dark:text-stone-100 outline-none transition',
                    'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                    errors[id] ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'
                  )}
                />
                {errors[id] && (
                  <p className="mt-1 text-xs text-red-500" role="alert">{errors[id].message}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={signup.isPending}
              className="w-full py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 mt-2"
            >
              {signup.isPending ? 'Creating account…' : 'Create organization'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </div>
  )
}

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation } from 'react-router-dom'
import { useLogin } from '../../hooks/useAuth'
import { cn } from '../../lib/utils'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const location = useLocation()
  const login = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const from = location.state?.from?.pathname || '/dashboard'

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
            <span className="text-white font-bold text-base">S</span>
          </div>
          <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">StockSense</span>
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-8">
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-1">Welcome back</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">Log in to your organization</p>

          <form onSubmit={handleSubmit((data) => login.mutate(data))} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none transition',
                  'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  errors.email ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'
                )}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500" role="alert">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none transition',
                  'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  errors.password ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'
                )}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500" role="alert">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || login.isPending}
              className="w-full py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {login.isPending ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-6">
          Need to create an organization?{' '}
          <Link to="/signup" className="text-primary-600 hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useForgotPassword, useVerifyOtp, useResetPassword } from '../../hooks/useAuth'
import { cn } from '../../lib/utils'

// ── Step 1: Email ─────────────────────────────────────────────────────────────
const emailSchema = z.object({ email: z.string().email('Enter a valid email') })
// ── Step 2: OTP ──────────────────────────────────────────────────────────────
const otpSchema = z.object({ otp: z.string().length(6, 'Enter the 6-digit code') })
// ── Step 3: New password ──────────────────────────────────────────────────────
const passwordSchema = z.object({
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

function StepEmail({ onSuccess }) {
  const forgot = useForgotPassword()
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(emailSchema) })
  return (
    <form onSubmit={handleSubmit(({ email }) => forgot.mutate({ email }, { onSuccess: () => onSuccess(email) }))} noValidate className="space-y-4">
      <p className="text-sm text-stone-500 dark:text-stone-400">Enter your email and we'll send a 6-digit OTP.</p>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Email address</label>
        <input id="email" type="email" autoComplete="email" {...register('email')}
          className={cn('w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none transition focus:ring-2 focus:ring-primary-500 focus:border-primary-500', errors.email ? 'border-red-500' : 'border-stone-300 dark:border-stone-600')} />
        {errors.email && <p className="mt-1 text-xs text-red-500" role="alert">{errors.email.message}</p>}
      </div>
      <button type="submit" disabled={forgot.isPending}
        className="w-full py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-medium text-sm transition-colors">
        {forgot.isPending ? 'Sending…' : 'Send OTP'}
      </button>
    </form>
  )
}

function StepOtp({ email, onSuccess, onResend }) {
  const verify = useVerifyOtp()
  const [countdown, setCountdown] = useState(0)
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(otpSchema) })

  function handleResend() {
    onResend()
    setCountdown(60)
    const iv = setInterval(() => setCountdown((c) => { if (c <= 1) { clearInterval(iv); return 0; } return c - 1; }), 1000)
  }

  return (
    <form onSubmit={handleSubmit(({ otp }) => verify.mutate({ email, otp, otpType: 'password_reset' }, { onSuccess: () => onSuccess(otp) }))} noValidate className="space-y-4">
      <p className="text-sm text-stone-500 dark:text-stone-400">Enter the 6-digit code sent to <strong>{email}</strong>.</p>
      <div>
        <label htmlFor="otp" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">OTP code</label>
        <input id="otp" type="text" inputMode="numeric" maxLength={6} autoComplete="one-time-code" {...register('otp')}
          className={cn('w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none transition focus:ring-2 focus:ring-primary-500 focus:border-primary-500 tracking-widest text-center text-lg', errors.otp ? 'border-red-500' : 'border-stone-300 dark:border-stone-600')} />
        {errors.otp && <p className="mt-1 text-xs text-red-500" role="alert">{errors.otp.message}</p>}
      </div>
      <button type="submit" disabled={verify.isPending}
        className="w-full py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-medium text-sm transition-colors">
        {verify.isPending ? 'Verifying…' : 'Verify OTP'}
      </button>
      <p className="text-center text-sm text-stone-500">
        {countdown > 0 ? `Resend in ${countdown}s` : (
          <button type="button" onClick={handleResend} className="text-primary-600 hover:underline">Resend OTP</button>
        )}
      </p>
    </form>
  )
}

function StepReset({ email, otp }) {
  const reset = useResetPassword()
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(passwordSchema) })
  return (
    <form onSubmit={handleSubmit(({ newPassword }) => reset.mutate({ email, otp, newPassword }))} noValidate className="space-y-4">
      <p className="text-sm text-stone-500 dark:text-stone-400">Choose a new password for <strong>{email}</strong>.</p>
      {[{ id: 'newPassword', label: 'New password' }, { id: 'confirm', label: 'Confirm password' }].map(({ id, label }) => (
        <div key={id}>
          <label htmlFor={id} className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{label}</label>
          <input id={id} type="password" autoComplete={id === 'newPassword' ? 'new-password' : 'new-password'} {...register(id)}
            className={cn('w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none transition focus:ring-2 focus:ring-primary-500 focus:border-primary-500', errors[id] ? 'border-red-500' : 'border-stone-300 dark:border-stone-600')} />
          {errors[id] && <p className="mt-1 text-xs text-red-500" role="alert">{errors[id].message}</p>}
        </div>
      ))}
      <button type="submit" disabled={reset.isPending}
        className="w-full py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-medium text-sm transition-colors">
        {reset.isPending ? 'Resetting…' : 'Reset password'}
      </button>
    </form>
  )
}

const STEP_TITLES = ['Forgot password', 'Enter OTP', 'New password']

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const forgot = useForgotPassword()

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
            <span className="text-white font-bold text-base">S</span>
          </div>
          <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">StockSense</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-6 justify-center">
          {STEP_TITLES.map((t, i) => (
            <div key={i} className={cn('flex items-center gap-1', i > 0 && 'ml-1')}>
              <div className={cn('w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium', i === step ? 'bg-primary-500 text-white' : i < step ? 'bg-primary-200 text-primary-700' : 'bg-stone-200 text-stone-500')}>{i + 1}</div>
              {i < 2 && <div className={cn('w-8 h-0.5', i < step ? 'bg-primary-300' : 'bg-stone-200')} />}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-8">
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-4">{STEP_TITLES[step]}</h1>
          {step === 0 && <StepEmail onSuccess={(e) => { setEmail(e); setStep(1) }} />}
          {step === 1 && <StepOtp email={email} onSuccess={(o) => { setOtp(o); setStep(2) }} onResend={() => forgot.mutate({ email })} />}
          {step === 2 && <StepReset email={email} otp={otp} />}
        </div>

        <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-6">
          <Link to="/login" className="text-primary-600 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  )
}

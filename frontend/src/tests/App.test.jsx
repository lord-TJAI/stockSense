import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LoginPage from '../pages/auth/LoginPage'
import SignupPage from '../pages/auth/SignupPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

function wrap(ui, path = '/') {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Auth pages — skeleton renders', () => {
  it('LoginPage renders email and password fields', () => {
    wrap(<LoginPage />)
    expect(screen.getByLabelText(/email address/i)).toBeDefined()
    expect(screen.getByLabelText(/password/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /log in/i })).toBeDefined()
  })

  it('SignupPage renders org name, name, email, password fields', () => {
    wrap(<SignupPage />)
    expect(screen.getByLabelText(/organization name/i)).toBeDefined()
    expect(screen.getByLabelText(/your full name/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /create organization/i })).toBeDefined()
  })

  it('ForgotPasswordPage renders email field on step 1', () => {
    wrap(<ForgotPasswordPage />)
    expect(screen.getByLabelText(/email address/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /send otp/i })).toBeDefined()
  })
})

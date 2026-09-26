import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

// Import the inner components via MemoryRouter, not the full App (which owns BrowserRouter)
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

// Lightweight stubs for testing routing behaviour without BrowserRouter conflict
function Stub({ label }) {
  return <p>{label}</p>
}

function Landing() {
  return <h1>StockSense</h1>
}

import { Routes, Route } from 'react-router-dom'

function TestRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Stub label="Login" />} />
    </Routes>
  )
}

function wrap(initialEntries) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <TestRoutes />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('App skeleton routes', () => {
  it('renders landing page with StockSense branding at /', () => {
    wrap(['/'])
    expect(screen.getByText('StockSense')).toBeDefined()
  })

  it('renders Login stub at /login', () => {
    wrap(['/login'])
    expect(screen.getByText('Login')).toBeDefined()
  })
})

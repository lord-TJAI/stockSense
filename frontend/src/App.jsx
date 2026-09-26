import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import AcceptInvitePage from './pages/auth/AcceptInvitePage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import useAuthStore from './store/authStore'

// Placeholder authenticated screens — replaced in later phases
function DashboardStub() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900">
      <div className="text-center space-y-3 p-8">
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Dashboard</h1>
        <p className="text-stone-500">Welcome, <strong>{user?.name}</strong> ({user?.role})</p>
        <p className="text-xs text-stone-400">Phase 1a complete — full UI coming in Phase 3</p>
        <button onClick={() => { clearAuth(); window.location.href = '/login' }}
          className="mt-4 px-4 py-2 rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 text-sm hover:bg-stone-300 dark:hover:bg-stone-600 transition">
          Log out
        </button>
      </div>
    </div>
  )
}

function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-stone-900 dark:to-stone-800">
      <div className="text-center space-y-4 p-8 max-w-lg">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">StockSense</h1>
        </div>
        <p className="text-lg text-stone-600 dark:text-stone-400">
          Modern, multi-tenant Inventory Management. Replace spreadsheets with live-updating stock control.
        </p>
        <div className="flex gap-3 justify-center mt-8">
          <a href="/login" className="px-6 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors">Log in</a>
          <a href="/signup" className="px-6 py-2.5 rounded-lg border border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-medium transition-colors">Create org</a>
        </div>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <p className="text-6xl font-bold text-stone-300 dark:text-stone-700 mb-4">404</p>
        <h2 className="text-xl font-semibold text-stone-700 dark:text-stone-300 mb-2">Page not found</h2>
        <a href="/" className="text-primary-600 hover:underline text-sm">Go home</a>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardStub /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Placeholder screens — will be replaced in later phases
function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-stone-900 dark:to-stone-800">
      <div className="text-center space-y-4 p-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <h1 className="text-3xl font-bold text-ink dark:text-stone-100">StockSense</h1>
        </div>
        <p className="text-lg text-stone-600 dark:text-stone-400 max-w-md mx-auto">
          Modern, multi-tenant Inventory Management. Replace spreadsheets with live-updating stock control.
        </p>
        <div className="flex gap-3 justify-center mt-8">
          <a
            href="/login"
            className="px-6 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
          >
            Log in
          </a>
          <a
            href="/signup"
            className="px-6 py-2.5 rounded-lg border border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-medium transition-colors"
          >
            Create org
          </a>
        </div>
        <p className="text-xs text-stone-400 mt-4">Phase 0 — skeleton scaffold ✓</p>
      </div>
    </div>
  )
}

function Stub({ label }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-stone-500 text-lg">{label} — coming soon</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Stub label="Login" />} />
        <Route path="/signup" element={<Stub label="Signup" />} />
        <Route path="/accept-invite/:token" element={<Stub label="Accept Invite" />} />
        <Route path="/forgot-password" element={<Stub label="Forgot Password" />} />
        <Route path="/verify-otp" element={<Stub label="Verify OTP" />} />
        <Route path="/reset-password" element={<Stub label="Reset Password" />} />
        <Route path="/dashboard" element={<Stub label="Dashboard" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import AcceptInvitePage from './pages/auth/AcceptInvitePage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/inventory/ProductsPage'
import WarehousesPage from './pages/inventory/WarehousesPage'
import CategoriesPage from './pages/inventory/CategoriesPage'
import ReceiptsPage from './pages/stock/ReceiptsPage'
import DeliveriesPage from './pages/stock/DeliveriesPage'
import TransfersPage from './pages/stock/TransfersPage'
import AdjustmentsPage from './pages/stock/AdjustmentsPage'
import useAuthStore from './store/authStore'
import { cn } from './lib/utils'

const NAV = [
  { to: '/dashboard',   label: 'Dashboard',   icon: '📊' },
  { to: '/products',    label: 'Products',    icon: '📦' },
  { to: '/warehouses',  label: 'Warehouses',  icon: '🏭' },
  { to: '/categories',  label: 'Categories',  icon: '🗂️' },
  { separator: true,    label: 'STOCK OPS' },
  { to: '/receipts',    label: 'Receipts',    icon: '📥' },
  { to: '/deliveries',  label: 'Deliveries',  icon: '📤' },
  { to: '/transfers',   label: 'Transfers',   icon: '🔄' },
  { to: '/adjustments', label: 'Adjustments', icon: '✏️' },
]

function AppShell({ children }) {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  return (
    <div className="min-h-screen flex bg-stone-50 dark:bg-stone-900">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white dark:bg-stone-800 border-r border-stone-200 dark:border-stone-700 flex flex-col">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-stone-200 dark:border-stone-700">
          <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-stone-900 dark:text-stone-100">StockSense</span>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map((item, idx) =>
            item.separator ? (
              <p key={idx} className="px-3 pt-3 pb-1 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                {item.label}
              </p>
            ) : (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) => cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700/50'
                )}>
                <span>{item.icon}</span> {item.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="px-3 py-3 border-t border-stone-200 dark:border-stone-700">
          <div className="px-2 py-1 mb-1">
            <p className="text-xs font-medium text-stone-700 dark:text-stone-300 truncate">{user?.name}</p>
            <p className="text-xs text-stone-400 truncate">{user?.role === 'inventory_manager' ? 'Manager' : 'Staff'}</p>
          </div>
          <button onClick={() => { clearAuth(); window.location.href = '/login' }}
            className="w-full px-3 py-2 rounded-lg text-sm text-left text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700/50 transition-colors">
            🚪 Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
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

function Protected({ children }) {
  return <ProtectedRoute><AppShell>{children}</AppShell></ProtectedRoute>
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

        {/* Protected — wrapped in AppShell sidebar layout */}
        <Route path="/dashboard"    element={<Protected><DashboardPage /></Protected>} />
        <Route path="/products"     element={<Protected><ProductsPage /></Protected>} />
        <Route path="/warehouses"   element={<Protected><WarehousesPage /></Protected>} />
        <Route path="/categories"   element={<Protected><CategoriesPage /></Protected>} />
        <Route path="/receipts"     element={<Protected><ReceiptsPage /></Protected>} />
        <Route path="/deliveries"   element={<Protected><DeliveriesPage /></Protected>} />
        <Route path="/transfers"    element={<Protected><TransfersPage /></Protected>} />
        <Route path="/adjustments"  element={<Protected><AdjustmentsPage /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

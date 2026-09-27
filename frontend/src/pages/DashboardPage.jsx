import { useState } from 'react'
import { Link } from 'react-router-dom'
import KpiCard from '../../components/dashboard/KpiCard'
import { useDashboardKpis, useLowStockAlerts, useOutOfStockAlerts } from '../../hooks/useDashboard'
import useAuthStore from '../../store/authStore'
import { cn } from '../../lib/utils'

const DOC_META = {
  receipt:    { icon: '📥', label: 'Receipt',    color: 'text-green-600  dark:text-green-400' },
  delivery:   { icon: '📤', label: 'Delivery',   color: 'text-blue-600   dark:text-blue-400' },
  transfer:   { icon: '🔄', label: 'Transfer',   color: 'text-purple-600 dark:text-purple-400' },
  adjustment: { icon: '✏️', label: 'Adjustment', color: 'text-amber-600  dark:text-amber-400' },
}

function RecentMovementsFeed({ movements }) {
  if (!movements?.length) {
    return <p className="text-sm text-stone-400 italic py-4 text-center">No movements yet</p>
  }

  return (
    <ul className="space-y-2">
      {movements.map((doc) => {
        const meta  = DOC_META[doc.docType] || {}
        const first = doc.lines[0]
        return (
          <li key={doc._id}
            className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-100 dark:border-stone-700/50">
            <span className="text-lg mt-0.5 select-none">{meta.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className={cn('text-xs font-bold uppercase tracking-wide', meta.color)}>{meta.label}</span>
                <span className="font-mono text-xs text-stone-400">{doc.docNumber}</span>
              </div>
              <p className="text-sm text-stone-700 dark:text-stone-300 truncate mt-0.5">
                {first?.productId?.name ?? '—'}
                {doc.lines.length > 1 && <span className="text-stone-400"> +{doc.lines.length - 1} more</span>}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                {doc.createdBy?.name} · {new Date(doc.createdAt).toLocaleString()}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function LowStockTable({ alerts, isLoading }) {
  if (isLoading) return <div className="py-6 text-center text-stone-400 text-sm">Loading…</div>
  if (!alerts?.length) return (
    <div className="py-8 text-center space-y-1">
      <div className="text-3xl">✅</div>
      <p className="text-sm text-stone-500 dark:text-stone-400">No low-stock items</p>
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-100 dark:border-stone-700">
            {['Product', 'Stock', 'Reorder at', 'Deficit', 'Need to order'].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
          {alerts.map((a) => (
            <tr key={a.product._id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
              <td className="px-3 py-2.5">
                <p className="font-medium text-stone-800 dark:text-stone-200">{a.product.name}</p>
                <p className="font-mono text-xs text-stone-400">{a.product.sku}</p>
              </td>
              <td className="px-3 py-2.5">
                <span className="font-semibold text-amber-600 dark:text-amber-400">{a.totalQty}</span>
                <span className="text-xs text-stone-400 ml-1">{a.product.unitOfMeasure}</span>
              </td>
              <td className="px-3 py-2.5 text-stone-500">{a.reorderPoint}</td>
              <td className="px-3 py-2.5 font-medium text-red-600 dark:text-red-400">{a.deficit}</td>
              <td className="px-3 py-2.5 text-stone-500">{a.reorderQty || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OutOfStockTable({ products, isLoading }) {
  if (isLoading) return <div className="py-6 text-center text-stone-400 text-sm">Loading…</div>
  if (!products?.length) return (
    <div className="py-8 text-center space-y-1">
      <div className="text-3xl">✅</div>
      <p className="text-sm text-stone-500 dark:text-stone-400">All products have stock</p>
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-100 dark:border-stone-700">
            {['Product', 'SKU', 'Category', 'Action'].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
          {products.map((p) => (
            <tr key={p._id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
              <td className="px-3 py-2.5 font-medium text-stone-800 dark:text-stone-200">{p.name}</td>
              <td className="px-3 py-2.5 font-mono text-xs text-stone-400">{p.sku}</td>
              <td className="px-3 py-2.5 text-stone-500">{p.categoryId?.name || '—'}</td>
              <td className="px-3 py-2.5">
                <Link to="/receipts"
                  className="text-xs text-primary-600 hover:text-primary-800 hover:underline transition">
                  Record receipt →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [alertTab, setAlertTab] = useState('low')

  const { data: kpis, isLoading: kpisLoading, dataUpdatedAt } = useDashboardKpis()
  const { data: lowStockData,  isLoading: lowLoading }  = useLowStockAlerts({ limit: 10 })
  const { data: outStockData,  isLoading: outLoading }  = useOutOfStockAlerts({ limit: 10 })

  const kpiCards = [
    { label: 'Total Products',   value: kpis?.totalProducts,   icon: '📦', color: 'blue',   sublabel: 'active, non-deleted' },
    { label: 'Warehouses',       value: kpis?.totalWarehouses, icon: '🏭', color: 'purple', sublabel: 'active' },
    { label: 'Locations',        value: kpis?.totalLocations,  icon: '📍', color: 'stone',  sublabel: 'active' },
    { label: 'In Stock',         value: kpis?.inStock,         icon: '✅', color: 'green',  sublabel: 'products with qty > 0' },
    { label: 'Low Stock',        value: kpis?.lowStock,        icon: '⚠️', color: 'amber',
      sublabel: 'below reorder point', onClick: kpis?.lowStock > 0 ? () => setAlertTab('low') : undefined },
    { label: 'Out of Stock',     value: kpis?.outOfStock,      icon: '🚨', color: 'red',
      sublabel: 'zero quantity', onClick: kpis?.outOfStock > 0 ? () => setAlertTab('out') : undefined },
  ]

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Dashboard</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Welcome back, <strong>{user?.name}</strong>
            {lastUpdated && <span className="ml-2 text-xs text-stone-400">· updated {lastUpdated}</span>}
          </p>
        </div>
        <span className="text-xs text-stone-400 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-full">
          📡 Auto-refreshes every 30 s
        </span>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((card) => (
          <KpiCard key={card.label} {...card} loading={kpisLoading} />
        ))}
      </div>

      {/* Main content: Alerts + Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Alerts panel — 2/3 width */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-stone-200 dark:border-stone-700">
            {[
              { id: 'low', label: '⚠️ Low Stock',     count: kpis?.lowStock },
              { id: 'out', label: '🚨 Out of Stock',  count: kpis?.outOfStock },
            ].map(({ id, label, count }) => (
              <button key={id} onClick={() => setAlertTab(id)}
                className={cn(
                  'flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  alertTab === id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                )}>
                {label}
                {count > 0 && (
                  <span className={cn(
                    'ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold',
                    id === 'low' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                : 'bg-red-100  text-red-700  dark:bg-red-900/40  dark:text-red-400'
                  )}>{count > 99 ? '99+' : count}</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4">
            {alertTab === 'low'
              ? <LowStockTable  alerts={lowStockData?.alerts}   isLoading={lowLoading} />
              : <OutOfStockTable products={outStockData?.products} isLoading={outLoading} />
            }

            {alertTab === 'low' && (lowStockData?.pagination?.total ?? 0) > 10 && (
              <p className="text-xs text-stone-400 mt-3 text-center">
                Showing 10 of {lowStockData.pagination.total}. Record a receipt to restock.
              </p>
            )}
          </div>
        </div>

        {/* Recent Movements — 1/3 width */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700">
          <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-700">
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">Recent movements</h2>
            <p className="text-xs text-stone-400 mt-0.5">Last 8 across all types</p>
          </div>
          <div className="p-4">
            {kpisLoading
              ? <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-14 rounded-xl bg-stone-100 dark:bg-stone-700 animate-pulse" />)}</div>
              : <RecentMovementsFeed movements={kpis?.recentMovements} />
            }
          </div>
        </div>

      </div>

      {/* Quick-action shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/receipts',    label: 'Record receipt',  icon: '📥', desc: 'Goods in' },
          { to: '/deliveries',  label: 'New delivery',    icon: '📤', desc: 'Goods out' },
          { to: '/transfers',   label: 'Transfer stock',  icon: '🔄', desc: 'Move between locations' },
          { to: '/products',    label: 'Add product',     icon: '📦', desc: 'Create new SKU' },
        ].map(({ to, label, icon, desc }) => (
          <Link key={to} to={to}
            className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all group">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{label}</p>
              <p className="text-xs text-stone-400">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

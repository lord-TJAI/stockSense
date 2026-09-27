import { cn } from '../../lib/utils'

const TREND_ICONS = {
  up:      '↑',
  down:    '↓',
  neutral: '—',
}

const COLOR_CLASSES = {
  blue:   'bg-blue-50   dark:bg-blue-900/20   text-blue-600   dark:text-blue-400   border-blue-100  dark:border-blue-800/50',
  green:  'bg-green-50  dark:bg-green-900/20  text-green-600  dark:text-green-400  border-green-100 dark:border-green-800/50',
  amber:  'bg-amber-50  dark:bg-amber-900/20  text-amber-600  dark:text-amber-400  border-amber-100 dark:border-amber-800/50',
  red:    'bg-red-50    dark:bg-red-900/20    text-red-600    dark:text-red-400    border-red-100   dark:border-red-800/50',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800/50',
  stone:  'bg-stone-50  dark:bg-stone-800     text-stone-600  dark:text-stone-400  border-stone-200 dark:border-stone-700',
}

export default function KpiCard({ label, value, icon, color = 'stone', sublabel, loading, onClick }) {
  const colors = COLOR_CLASSES[color]

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'relative rounded-2xl border p-5 text-left transition-all',
        'hover:shadow-md disabled:cursor-default',
        colors
      )}
    >
      {loading && (
        <div className="absolute inset-0 rounded-2xl bg-white/50 dark:bg-stone-900/50 animate-pulse" />
      )}

      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl select-none" aria-hidden>{icon}</span>
        {onClick && (
          <span className="text-xs opacity-60 mt-1">View →</span>
        )}
      </div>

      <p className="text-3xl font-bold tabular-nums tracking-tight">
        {loading ? <span className="inline-block w-12 h-8 bg-current opacity-20 rounded animate-pulse" /> : value ?? '—'}
      </p>

      <p className="mt-1 text-sm font-medium opacity-80">{label}</p>

      {sublabel && (
        <p className="mt-0.5 text-xs opacity-60">{sublabel}</p>
      )}
    </button>
  )
}

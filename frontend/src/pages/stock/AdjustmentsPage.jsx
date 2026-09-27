import { useState } from 'react'
import { MutationForm, LedgerList } from '../../components/stock/MutationForm'
import { useAdjustments, useCreateAdjustment } from '../../hooks/useStock'
import useAuthStore from '../../store/authStore'

export default function AdjustmentsPage() {
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const isManager = useAuthStore((s) => s.isManager())
  const { data, isLoading } = useAdjustments({ page, limit: 20 })
  const create = useCreateAdjustment()

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">✏️ Adjustments</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Set stock to an exact quantity after a physical count — manager only
          </p>
        </div>
        {isManager && (
          <button onClick={() => setShowForm(v => !v)}
            className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors">
            {showForm ? 'Hide form' : '+ New adjustment'}
          </button>
        )}
      </div>

      {!isManager && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Only Inventory Managers can create adjustments.
        </div>
      )}

      {showForm && isManager && (
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6">
          <h2 className="text-base font-semibold text-stone-800 dark:text-stone-200 mb-4">New stock adjustment</h2>
          <MutationForm docType="adjustment" isPending={create.isPending}
            onSubmit={(data) => create.mutate(data, { onSuccess: () => setShowForm(false) })} />
        </div>
      )}

      <LedgerList docs={data?.docs} pagination={data?.pagination}
        page={page} setPage={setPage} isLoading={isLoading}
        emptyMsg="No adjustments recorded yet." />
    </div>
  )
}

import { useState } from 'react'
import { MutationForm, LedgerList } from '../../components/stock/MutationForm'
import { useReceipts, useCreateReceipt } from '../../hooks/useStock'

export default function ReceiptsPage() {
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const { data, isLoading } = useReceipts({ page, limit: 20 })
  const create = useCreateReceipt()

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">📥 Receipts</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">Record goods received into stock</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors">
          {showForm ? 'Hide form' : '+ New receipt'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6">
          <h2 className="text-base font-semibold text-stone-800 dark:text-stone-200 mb-4">New goods receipt</h2>
          <MutationForm docType="receipt" isPending={create.isPending}
            onSubmit={(data) => create.mutate(data, { onSuccess: () => setShowForm(false) })} />
        </div>
      )}

      <LedgerList docs={data?.docs} pagination={data?.pagination}
        page={page} setPage={setPage} isLoading={isLoading}
        emptyMsg="No receipts yet. Record your first goods receipt above." />
    </div>
  )
}

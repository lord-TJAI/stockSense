import { useState } from 'react'
import { MutationForm, LedgerList } from '../../components/stock/MutationForm'
import { useTransfers, useCreateTransfer } from '../../hooks/useStock'

export default function TransfersPage() {
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const { data, isLoading } = useTransfers({ page, limit: 20 })
  const create = useCreateTransfer()

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">🔄 Transfers</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">Move stock between locations — transaction-wrapped for atomicity</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors">
          {showForm ? 'Hide form' : '+ New transfer'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6">
          <h2 className="text-base font-semibold text-stone-800 dark:text-stone-200 mb-4">New transfer</h2>
          <MutationForm docType="transfer" isPending={create.isPending}
            onSubmit={(data) => create.mutate(data, { onSuccess: () => setShowForm(false) })} />
        </div>
      )}

      <LedgerList docs={data?.docs} pagination={data?.pagination}
        page={page} setPage={setPage} isLoading={isLoading}
        emptyMsg="No transfers yet." />
    </div>
  )
}

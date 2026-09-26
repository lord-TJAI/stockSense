import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCategories, useCreateCategory, useUpdateCategory } from '../../hooks/useInventory'
import useAuthStore from '../../store/authStore'
import { cn } from '../../lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  parentCategory: z.string().optional(),
})

function CategoryRow({ cat, categories, isManager, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const { register, handleSubmit, reset } = useForm({ defaultValues: { name: cat.name } })
  const update = useUpdateCategory()

  if (editing) {
    return (
      <tr className="bg-primary-50 dark:bg-primary-900/10">
        <td colSpan={3} className="px-4 py-2">
          <form onSubmit={handleSubmit((d) => update.mutate({ id: cat._id, data: d }, { onSuccess: () => { setEditing(false); onUpdate() } }))}
            className="flex gap-2">
            <input {...register('name')} className="flex-1 px-3 py-1.5 rounded-lg border border-primary-300 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            <button type="submit" disabled={update.isPending}
              className="px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm disabled:opacity-60">Save</button>
            <button type="button" onClick={() => { setEditing(false); reset() }}
              className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 text-sm hover:bg-stone-50">Cancel</button>
          </form>
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-stone-50 dark:hover:bg-stone-700/30 transition-colors">
      <td className="px-4 py-3 font-medium text-stone-800 dark:text-stone-200">{cat.name}</td>
      <td className="px-4 py-3 text-stone-500 dark:text-stone-400">{cat.parentCategory?.name || '—'}</td>
      <td className="px-4 py-3">
        {isManager && (
          <button onClick={() => setEditing(true)}
            className="text-xs text-primary-600 hover:text-primary-800 hover:underline transition">Edit</button>
        )}
      </td>
    </tr>
  )
}

export default function CategoriesPage() {
  const isManager = useAuthStore((s) => s.isManager())
  const { data, isLoading, refetch } = useCategories()
  const createCategory = useCreateCategory()
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const categories = data?.categories || []

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Categories</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">{categories.length} categories</p>
      </div>

      {isManager && (
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">Add category</h3>
          <form onSubmit={handleSubmit((d) => createCategory.mutate(d, { onSuccess: reset }))}
            noValidate className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[160px]">
              <input placeholder="Category name" {...register('name')}
                className={cn('w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none transition focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  errors.name ? 'border-red-500' : 'border-stone-300 dark:border-stone-600')} />
              {errors.name && <p className="mt-0.5 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="w-44">
              <select {...register('parentCategory')}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-primary-500 transition">
                <option value="">No parent</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <button type="submit" disabled={createCategory.isPending}
              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white text-sm font-medium transition-colors">
              {createCategory.isPending ? '…' : '+ Add'}
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-stone-400">Loading categories…</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <div className="text-5xl">🗂️</div>
          <p className="text-stone-500 dark:text-stone-400">No categories yet</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-700">
              <tr>
                {['Name', 'Parent', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-700/50">
              {categories.map((cat) => (
                <CategoryRow key={cat._id} cat={cat} categories={categories} isManager={isManager} onUpdate={refetch} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

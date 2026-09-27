import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useProducts, useCreateProduct, useDeleteProduct, useCategories } from '../../hooks/useInventory'
import useAuthStore from '../../store/authStore'
import { cn } from '../../lib/utils'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required').max(50),
  categoryId: z.string().optional(),
  unitOfMeasure: z.string().min(1).default('pcs'),
  reorderPoint: z.coerce.number().min(0).default(0),
  reorderQty: z.coerce.number().min(0).default(0),
})

function StockBadge({ qty, reorderPoint }) {
  if (qty === 0) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Out of stock</span>
  if (qty <= reorderPoint) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Low stock</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">In stock</span>
}

function ProductFormModal({ onClose, onSubmit, isPending, categories }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(productSchema) })
  const [preview, setPreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  function submit(data) {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, v) })
    if (imageFile) fd.append('image', imageFile)
    onSubmit(fd)
  }

  const fields = [
    { id: 'name', label: 'Product name', type: 'text', required: true },
    { id: 'sku', label: 'SKU', type: 'text', required: true },
    { id: 'unitOfMeasure', label: 'Unit of measure', type: 'text', placeholder: 'pcs' },
    { id: 'reorderPoint', label: 'Reorder point', type: 'number' },
    { id: 'reorderQty', label: 'Reorder quantity', type: 'number' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Add product</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Product image</label>
            <div className="flex items-center gap-3">
              {preview ? (
                <img src={preview} alt="preview" className="w-16 h-16 rounded-lg object-cover border border-stone-200" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-stone-100 dark:bg-stone-700 flex items-center justify-center text-2xl">📦</div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange}
                className="text-sm text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
            </div>
          </div>

          {fields.map(({ id, label, type, required, placeholder }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input id={id} type={type} placeholder={placeholder} {...register(id)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none transition',
                  'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  errors[id] ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'
                )} />
              {errors[id] && <p className="mt-1 text-xs text-red-500">{errors[id].message}</p>}
            </div>
          ))}

          {/* Category */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Category</label>
            <select id="categoryId" {...register('categoryId')}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none transition focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              <option value="">No category</option>
              {categories?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-stone-300 dark:border-stone-600 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 transition">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white text-sm font-medium transition">
              {isPending ? 'Creating…' : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const isManager = useAuthStore((s) => s.isManager())
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useProducts({ search, categoryId: categoryId || undefined, page, limit: 20 })
  const { data: catData } = useCategories()
  const createProduct = useCreateProduct()
  const deleteProduct = useDeleteProduct()

  const products = data?.products || []
  const pagination = data?.pagination
  const categories = catData?.categories || []

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Products</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {pagination?.total ?? '…'} products · auto-updates every 30s
          </p>
        </div>
        {isManager && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors">
            <span className="text-lg leading-none">+</span> Add product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="search" placeholder="Search name or SKU…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-primary-500 transition" />
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-primary-500 transition">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-20 text-stone-400">Loading products…</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 space-y-2">
          <div className="text-5xl">📦</div>
          <p className="text-stone-500 dark:text-stone-400">No products yet</p>
          {isManager && <button onClick={() => setShowForm(true)} className="text-primary-600 hover:underline text-sm">Add your first product</button>}
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-700">
                <tr>
                  {['Product', 'SKU', 'Category', 'UoM', 'Total Stock', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-700/50">
                {products.map((p) => {
                  const totalQty = p.stockLevels?.reduce((s, sl) => s + sl.quantity, 0) || 0
                  return (
                    <tr key={p._id} className="hover:bg-stone-50 dark:hover:bg-stone-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-stone-200" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-700 flex items-center justify-center text-base">📦</div>
                          )}
                          <span className="font-medium text-stone-800 dark:text-stone-200">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-stone-600 dark:text-stone-400">{p.sku}</td>
                      <td className="px-4 py-3 text-stone-500 dark:text-stone-400">{p.categoryId?.name || '—'}</td>
                      <td className="px-4 py-3 text-stone-500 dark:text-stone-400">{p.unitOfMeasure}</td>
                      <td className="px-4 py-3 font-medium text-stone-800 dark:text-stone-200">{totalQty}</td>
                      <td className="px-4 py-3"><StockBadge qty={totalQty} reorderPoint={p.reorderPoint} /></td>
                      <td className="px-4 py-3">
                        {isManager && (
                          <button onClick={() => { if (window.confirm(`Delete "${p.name}"?`)) deleteProduct.mutate(p._id) }}
                            className="text-xs text-red-500 hover:text-red-700 hover:underline transition">
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 dark:border-stone-700">
              <p className="text-sm text-stone-500">Page {page} of {pagination.pages}</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 text-sm disabled:opacity-40 hover:bg-stone-50 dark:hover:bg-stone-700 transition">← Prev</button>
                <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 text-sm disabled:opacity-40 hover:bg-stone-50 dark:hover:bg-stone-700 transition">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <ProductFormModal
          categories={categories}
          isPending={createProduct.isPending}
          onClose={() => setShowForm(false)}
          onSubmit={(fd) => createProduct.mutate(fd, { onSuccess: () => setShowForm(false) })}
        />
      )}
    </div>
  )
}

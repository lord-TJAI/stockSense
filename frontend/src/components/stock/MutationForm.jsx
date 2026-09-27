import { useState } from 'react'
import { useWarehouses, useLocations } from '../../hooks/useInventory'
import { useProducts } from '../../hooks/useInventory'
import { cn } from '../../lib/utils'

/**
 * Shared line-item builder used by Receipt, Delivery, Transfer and Adjustment pages.
 * Props:
 *   - docType: 'receipt' | 'delivery' | 'transfer' | 'adjustment'
 *   - onSubmit(lines, meta): called when form is submitted
 *   - isPending: boolean
 *   - title / description
 */

function LocationSelect({ value, onChange, warehouseOptions, label = 'Location' }) {
  const [wh, setWh] = useState('')
  const { data } = useLocations(wh)
  const locations = data?.locations || []

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">{label}</label>
      <select value={wh} onChange={(e) => { setWh(e.target.value); onChange('') }}
        className="w-full px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 text-xs bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-primary-500">
        <option value="">— Warehouse —</option>
        {warehouseOptions.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
      </select>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        disabled={!wh}
        className="w-full px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 text-xs bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50">
        <option value="">— Location —</option>
        {locations.map((l) => <option key={l._id} value={l._id}>{l.name} ({l.code})</option>)}
      </select>
    </div>
  )
}

export function MutationForm({ docType, onSubmit, isPending }) {
  const { data: whData } = useWarehouses()
  const { data: prodData } = useProducts({ limit: 200 })
  const warehouses = whData?.warehouses || []
  const products   = prodData?.products  || []

  const [lines, setLines] = useState([emptyLine(docType)])
  const [notes, setNotes]           = useState('')
  const [referenceDoc, setRefDoc]   = useState('')

  function emptyLine(type) {
    const base = { productId: '', quantity: '', unitCost: '' }
    if (type === 'receipt')    return { ...base, toLocationId: '' }
    if (type === 'delivery')   return { ...base, fromLocationId: '' }
    if (type === 'transfer')   return { ...base, fromLocationId: '', toLocationId: '' }
    if (type === 'adjustment') return { productId: '', locationId: '', newQuantity: '' }
    return base
  }

  function updateLine(i, field, val) {
    setLines((ls) => ls.map((l, idx) => idx === i ? { ...l, [field]: val } : l))
  }

  function submit(e) {
    e.preventDefault()
    const parsed = lines.map((l) => {
      const out = { ...l }
      if ('quantity' in out) out.quantity = Number(out.quantity)
      if ('newQuantity' in out) out.newQuantity = Number(out.newQuantity)
      if ('unitCost' in out && out.unitCost !== '') out.unitCost = Number(out.unitCost)
      else delete out.unitCost
      return out
    })
    onSubmit({ lines: parsed, notes, referenceDoc })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Lines */}
      <div className="space-y-3">
        {lines.map((line, i) => (
          <div key={i} className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Line {i + 1}</span>
              {lines.length > 1 && (
                <button type="button" onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-400 hover:text-red-600 transition">Remove</button>
              )}
            </div>

            {/* Product */}
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Product *</label>
              <select value={line.productId} onChange={(e) => updateLine(i, 'productId', e.target.value)} required
                className="w-full px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 text-xs bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">— Select product —</option>
                {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>

            {/* Location fields */}
            <div className={cn('grid gap-3', docType === 'transfer' ? 'grid-cols-2' : 'grid-cols-1')}>
              {(docType === 'receipt' || docType === 'transfer') && (
                <LocationSelect label={docType === 'transfer' ? 'From location *' : 'To location *'}
                  value={docType === 'receipt' ? line.toLocationId : line.fromLocationId}
                  onChange={(v) => updateLine(i, docType === 'receipt' ? 'toLocationId' : 'fromLocationId', v)}
                  warehouseOptions={warehouses} />
              )}
              {docType === 'delivery' && (
                <LocationSelect label="From location *"
                  value={line.fromLocationId}
                  onChange={(v) => updateLine(i, 'fromLocationId', v)}
                  warehouseOptions={warehouses} />
              )}
              {docType === 'transfer' && (
                <LocationSelect label="To location *"
                  value={line.toLocationId}
                  onChange={(v) => updateLine(i, 'toLocationId', v)}
                  warehouseOptions={warehouses} />
              )}
              {docType === 'adjustment' && (
                <LocationSelect label="Location *"
                  value={line.locationId}
                  onChange={(v) => updateLine(i, 'locationId', v)}
                  warehouseOptions={warehouses} />
              )}
            </div>

            {/* Qty / new qty */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  {docType === 'adjustment' ? 'New quantity *' : 'Quantity *'}
                </label>
                <input type="number" min={docType === 'adjustment' ? '0' : '1'} step="any" required
                  value={docType === 'adjustment' ? line.newQuantity : line.quantity}
                  onChange={(e) => updateLine(i, docType === 'adjustment' ? 'newQuantity' : 'quantity', e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 text-xs bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              {docType === 'receipt' && (
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Unit cost (optional)</label>
                  <input type="number" min="0" step="any" value={line.unitCost}
                    onChange={(e) => updateLine(i, 'unitCost', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 text-xs bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00" />
                </div>
              )}
            </div>
          </div>
        ))}

        <button type="button" onClick={() => setLines((ls) => [...ls, emptyLine(docType)])}
          className="text-sm text-primary-600 hover:text-primary-800 hover:underline transition">
          + Add another line
        </button>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Reference doc</label>
          <input type="text" value={referenceDoc} onChange={(e) => setRefDoc(e.target.value)}
            placeholder="PO-123 / SO-456 / etc."
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 text-sm bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-primary-500 transition" />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Notes</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 text-sm bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-primary-500 transition" />
        </div>
      </div>

      <button type="submit" disabled={isPending}
        className="w-full py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-medium text-sm transition-colors">
        {isPending ? 'Saving…' : 'Confirm & save'}
      </button>
    </form>
  )
}

const DOC_TYPE_META = {
  receipt:    { label: 'Receipt',    icon: '📥', color: 'green',  prefix: 'REC' },
  delivery:   { label: 'Delivery',   icon: '📤', color: 'blue',   prefix: 'DEL' },
  transfer:   { label: 'Transfer',   icon: '🔄', color: 'purple', prefix: 'TRF' },
  adjustment: { label: 'Adjustment', icon: '✏️', color: 'amber',  prefix: 'ADJ' },
}

export function LedgerList({ docs, pagination, page, setPage, isLoading, emptyMsg }) {
  if (isLoading) return <div className="text-center py-12 text-stone-400">Loading…</div>
  if (!docs?.length) return (
    <div className="text-center py-16 space-y-2">
      <div className="text-4xl">📋</div>
      <p className="text-stone-500 dark:text-stone-400">{emptyMsg}</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {docs.map((doc) => {
        const meta = DOC_TYPE_META[doc.docType] || {}
        return (
          <div key={doc._id} className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{meta.icon}</span>
                <div>
                  <p className="font-mono text-sm font-semibold text-stone-800 dark:text-stone-200">{doc.docNumber}</p>
                  <p className="text-xs text-stone-400">{new Date(doc.createdAt).toLocaleString()} · {doc.createdBy?.name}</p>
                </div>
              </div>
              {doc.referenceDoc && (
                <span className="text-xs text-stone-500 bg-stone-100 dark:bg-stone-700 px-2 py-0.5 rounded-full">
                  Ref: {doc.referenceDoc}
                </span>
              )}
            </div>
            <div className="space-y-1.5 ml-7">
              {doc.lines.map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                  <span className="font-medium text-stone-700 dark:text-stone-300">
                    {l.productId?.name || l.productId} ({l.productId?.sku})
                  </span>
                  <span>×{l.quantity}</span>
                  {l.fromLocationId && <span className="text-xs">from <strong>{l.fromLocationId?.name}</strong></span>}
                  {l.toLocationId && <span className="text-xs">→ <strong>{l.toLocationId?.name}</strong></span>}
                </div>
              ))}
            </div>
            {doc.notes && <p className="mt-2 ml-7 text-xs text-stone-400 italic">"{doc.notes}"</p>}
          </div>
        )
      })}

      {pagination?.pages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-stone-400">Page {page} of {pagination.pages}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 text-sm disabled:opacity-40 hover:bg-stone-50 dark:hover:bg-stone-700 transition">← Prev</button>
            <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 text-sm disabled:opacity-40 hover:bg-stone-50 dark:hover:bg-stone-700 transition">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useWarehouses, useCreateWarehouse, useDeactivateWarehouse,
  useLocations, useCreateLocation,
} from '../../hooks/useInventory'
import useAuthStore from '../../store/authStore'
import { cn } from '../../lib/utils'

const warehouseSchema = z.object({
  name: z.string().min(1, 'Name required'),
  code: z.string().min(1, 'Code required').max(20),
  address: z.string().optional(),
})

const locationSchema = z.object({
  name: z.string().min(1, 'Name required'),
  code: z.string().min(1, 'Code required').max(20),
})

function InlineForm({ schema, fields, onSubmit, isPending, placeholder = 'Add…' }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })
  return (
    <form onSubmit={handleSubmit((d) => onSubmit(d, reset))} noValidate className="flex gap-2 flex-wrap">
      {fields.map(({ id, label, placeholder: ph, half }) => (
        <div key={id} className={half ? 'w-28' : 'flex-1 min-w-[120px]'}>
          <input id={id} placeholder={ph || label} {...register(id)}
            className={cn(
              'w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none transition',
              'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              errors[id] ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'
            )} />
          {errors[id] && <p className="mt-0.5 text-xs text-red-500">{errors[id].message}</p>}
        </div>
      ))}
      <button type="submit" disabled={isPending}
        className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white text-sm font-medium transition-colors whitespace-nowrap">
        {isPending ? '…' : '+ Add'}
      </button>
    </form>
  )
}

function LocationsPanel({ warehouseId, isManager }) {
  const { data, isLoading } = useLocations(warehouseId)
  const createLocation = useCreateLocation(warehouseId)
  const locations = data?.locations || []

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-sm font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide">Locations</h4>
      {isLoading ? <p className="text-xs text-stone-400">Loading…</p> : locations.length === 0 ? (
        <p className="text-xs text-stone-400 italic">No locations yet</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {locations.map((l) => (
            <span key={l._id} className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
              {l.name} <span className="opacity-50 ml-1">{l.code}</span>
            </span>
          ))}
        </div>
      )}
      {isManager && (
        <InlineForm
          schema={locationSchema}
          fields={[{ id: 'name', label: 'Location name' }, { id: 'code', label: 'CODE', half: true }]}
          isPending={createLocation.isPending}
          onSubmit={(data, reset) => createLocation.mutate(data, { onSuccess: reset })}
        />
      )}
    </div>
  )
}

export default function WarehousesPage() {
  const isManager = useAuthStore((s) => s.isManager())
  const [expanded, setExpanded] = useState(null)

  const { data, isLoading } = useWarehouses()
  const createWarehouse = useCreateWarehouse()
  const deactivate = useDeactivateWarehouse()

  const warehouses = data?.warehouses || []

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Warehouses</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">{warehouses.length} active</p>
      </div>

      {isManager && (
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
          <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">Add warehouse</h3>
          <InlineForm
            schema={warehouseSchema}
            fields={[
              { id: 'name', label: 'Name' },
              { id: 'code', label: 'CODE', half: true },
              { id: 'address', label: 'Address (optional)' },
            ]}
            isPending={createWarehouse.isPending}
            onSubmit={(data, reset) => createWarehouse.mutate(data, { onSuccess: reset })}
          />
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-stone-400">Loading warehouses…</div>
      ) : warehouses.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <div className="text-5xl">🏭</div>
          <p className="text-stone-500 dark:text-stone-400">No warehouses yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {warehouses.map((w) => (
            <div key={w._id}
              className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === w._id ? null : w._id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-50 dark:hover:bg-stone-700/40 transition">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏭</span>
                  <div>
                    <p className="font-semibold text-stone-800 dark:text-stone-200">{w.name}</p>
                    <p className="text-xs text-stone-500">{w.code}{w.address ? ` · ${w.address}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isManager && (
                    <button
                      onClick={(e) => { e.stopPropagation(); if (window.confirm(`Deactivate "${w.name}"?`)) deactivate.mutate(w._id) }}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline transition px-2 py-1">
                      Deactivate
                    </button>
                  )}
                  <span className="text-stone-400 text-lg">{expanded === w._id ? '▲' : '▼'}</span>
                </div>
              </button>

              {expanded === w._id && (
                <div className="px-5 pb-5 border-t border-stone-100 dark:border-stone-700/50">
                  <LocationsPanel warehouseId={w._id} isManager={isManager} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

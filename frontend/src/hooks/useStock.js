import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { stockApi } from '../api/stock'

function makeListHook(type, listFn) {
  return (params) =>
    useQuery({
      queryKey: [type, params],
      queryFn: () => listFn(params).then((r) => r.data.data),
      refetchInterval: 30000,
    })
}

function makeCreateHook(type, createFn, invalidates = []) {
  return () => {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: createFn,
      onSuccess: () => {
        ;[type, 'products', ...invalidates].forEach((k) =>
          qc.invalidateQueries({ queryKey: [k] })
        )
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} recorded`)
      },
      onError: (e) => toast.error(e.response?.data?.message || `Failed to create ${type}`),
    })
  }
}

export const useReceipts    = makeListHook('receipts',    stockApi.listReceipts)
export const useDeliveries  = makeListHook('deliveries',  stockApi.listDeliveries)
export const useTransfers   = makeListHook('transfers',   stockApi.listTransfers)
export const useAdjustments = makeListHook('adjustments', stockApi.listAdjustments)

export const useCreateReceipt    = makeCreateHook('receipt',    stockApi.createReceipt,    ['receipts'])
export const useCreateDelivery   = makeCreateHook('delivery',   stockApi.createDelivery,   ['deliveries'])
export const useCreateTransfer   = makeCreateHook('transfer',   stockApi.createTransfer,   ['transfers'])
export const useCreateAdjustment = makeCreateHook('adjustment', stockApi.createAdjustment, ['adjustments'])

export function useStockLevels(params) {
  return useQuery({
    queryKey: ['stock-levels', params],
    queryFn: () => stockApi.getStockLevels(params).then((r) => r.data.data),
    enabled: !!(params?.productId || params?.locationId),
    refetchInterval: 30000,
  })
}

export function useProductHistory(productId, params) {
  return useQuery({
    queryKey: ['stock-history', productId, params],
    queryFn: () => stockApi.getHistory(productId, params).then((r) => r.data.data),
    enabled: !!productId,
  })
}

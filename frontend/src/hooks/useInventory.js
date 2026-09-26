import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { warehouseApi, categoryApi, productApi } from '../api/inventory'

// ── Warehouses ────────────────────────────────────────────────────────────────
export function useWarehouses(params) {
  return useQuery({
    queryKey: ['warehouses', params],
    queryFn: () => warehouseApi.list(params).then((r) => r.data.data),
    refetchInterval: 30000,
  })
}

export function useWarehouse(id) {
  return useQuery({
    queryKey: ['warehouse', id],
    queryFn: () => warehouseApi.get(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useCreateWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: warehouseApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); toast.success('Warehouse created') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create warehouse'),
  })
}

export function useUpdateWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => warehouseApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); toast.success('Warehouse updated') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update warehouse'),
  })
}

export function useDeactivateWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: warehouseApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); toast.success('Warehouse deactivated') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  })
}

// ── Locations ─────────────────────────────────────────────────────────────────
export function useLocations(warehouseId) {
  return useQuery({
    queryKey: ['locations', warehouseId],
    queryFn: () => warehouseApi.listLocations(warehouseId).then((r) => r.data.data),
    enabled: !!warehouseId,
  })
}

export function useCreateLocation(warehouseId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => warehouseApi.createLocation(warehouseId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['locations', warehouseId] }); toast.success('Location created') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  })
}

// ── Categories ────────────────────────────────────────────────────────────────
export function useCategories(params) {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: () => categoryApi.list(params).then((r) => r.data.data),
    refetchInterval: 60000,
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: categoryApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category created') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => categoryApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category updated') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  })
}

// ── Products ──────────────────────────────────────────────────────────────────
export function useProducts(params) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productApi.list(params).then((r) => r.data.data),
    refetchInterval: 30000,
  })
}

export function useProduct(id) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.get(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: productApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product created') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create product'),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formData }) => productApi.update(id, formData),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['product', id] })
      toast.success('Product updated')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update product'),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product deleted') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete product'),
  })
}

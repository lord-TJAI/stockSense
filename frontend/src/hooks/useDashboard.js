import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard'

/** KPI summary — polled every 30 s */
export function useDashboardKpis() {
  return useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => dashboardApi.getKpis().then((r) => r.data.data),
    refetchInterval: 30000,
    staleTime: 15000,
  })
}

/** Low-stock alert list — polled every 60 s */
export function useLowStockAlerts(params) {
  return useQuery({
    queryKey: ['alerts-low-stock', params],
    queryFn: () => dashboardApi.getLowStock(params).then((r) => r.data.data),
    refetchInterval: 60000,
    staleTime: 30000,
  })
}

/** Out-of-stock alert list — polled every 60 s */
export function useOutOfStockAlerts(params) {
  return useQuery({
    queryKey: ['alerts-out-of-stock', params],
    queryFn: () => dashboardApi.getOutOfStock(params).then((r) => r.data.data),
    refetchInterval: 60000,
    staleTime: 30000,
  })
}

/** Per-product snapshot — polled every 30 s */
export function useProductSnapshot(productId) {
  return useQuery({
    queryKey: ['stock-snapshot', productId],
    queryFn: () => dashboardApi.getStockSnapshot(productId).then((r) => r.data.data),
    enabled: !!productId,
    refetchInterval: 30000,
  })
}

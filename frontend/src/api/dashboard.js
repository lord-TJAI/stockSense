import api from '../lib/axios'

export const dashboardApi = {
  getKpis:          ()       => api.get('/api/dashboard'),
  getLowStock:      (params) => api.get('/api/alerts/low-stock',    { params }),
  getOutOfStock:    (params) => api.get('/api/alerts/out-of-stock', { params }),
  getStockSnapshot: (pid)    => api.get(`/api/stock/snapshot/${pid}`),
}

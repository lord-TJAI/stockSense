import api from '../lib/axios'

export const stockApi = {
  // Receipts
  createReceipt:   (data) => api.post('/api/receipts', data),
  listReceipts:    (params) => api.get('/api/receipts', { params }),
  getReceipt:      (id) => api.get(`/api/receipts/${id}`),
  // Deliveries
  createDelivery:  (data) => api.post('/api/deliveries', data),
  listDeliveries:  (params) => api.get('/api/deliveries', { params }),
  getDelivery:     (id) => api.get(`/api/deliveries/${id}`),
  // Transfers
  createTransfer:  (data) => api.post('/api/transfers', data),
  listTransfers:   (params) => api.get('/api/transfers', { params }),
  getTransfer:     (id) => api.get(`/api/transfers/${id}`),
  // Adjustments
  createAdjustment:(data) => api.post('/api/adjustments', data),
  listAdjustments: (params) => api.get('/api/adjustments', { params }),
  getAdjustment:   (id) => api.get(`/api/adjustments/${id}`),
  // Current stock
  getStockLevels:  (params) => api.get('/api/stock/levels', { params }),
  getHistory:      (productId, params) => api.get(`/api/stock/history/${productId}`, { params }),
}

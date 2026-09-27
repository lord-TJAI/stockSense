import api from '../lib/axios'

export const warehouseApi = {
  list: (params) => api.get('/api/warehouses', { params }),
  get: (id) => api.get(`/api/warehouses/${id}`),
  create: (data) => api.post('/api/warehouses', data),
  update: (id, data) => api.patch(`/api/warehouses/${id}`, data),
  deactivate: (id) => api.delete(`/api/warehouses/${id}`),
  listLocations: (warehouseId, params) => api.get(`/api/warehouses/${warehouseId}/locations`, { params }),
  createLocation: (warehouseId, data) => api.post(`/api/warehouses/${warehouseId}/locations`, data),
  updateLocation: (id, data) => api.patch(`/api/locations/${id}`, data),
  deactivateLocation: (id) => api.delete(`/api/locations/${id}`),
}

export const categoryApi = {
  list: (params) => api.get('/api/categories', { params }),
  create: (data) => api.post('/api/categories', data),
  update: (id, data) => api.patch(`/api/categories/${id}`, data),
  deactivate: (id) => api.delete(`/api/categories/${id}`),
}

export const productApi = {
  list: (params) => api.get('/api/products', { params }),
  get: (id) => api.get(`/api/products/${id}`),
  create: (formData) => api.post('/api/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.patch(`/api/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/api/products/${id}`),
}

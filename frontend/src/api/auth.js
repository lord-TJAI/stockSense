import api from '../lib/axios'

export const authApi = {
  signup: (data) => api.post('/api/auth/signup', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  refresh: () => api.post('/api/auth/refresh'),
  verifyEmail: (data) => api.post('/api/auth/verify-email', data),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  verifyOtp: (data) => api.post('/api/auth/verify-otp', data),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),
  getInvite: (token) => api.get(`/api/auth/invites/${token}`),
  acceptInvite: (token, data) => api.post(`/api/auth/invites/${token}/accept`, data),
  sendInvite: (data) => api.post('/api/auth/invites', data),
  getSessions: () => api.get('/api/auth/sessions'),
  revokeSession: (id) => api.delete(`/api/auth/sessions/${id}`),
  revokeOtherSessions: () => api.delete('/api/auth/sessions/others'),
  getMe: () => api.get('/api/users/me'),
}

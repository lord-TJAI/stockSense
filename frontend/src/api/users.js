import api from '../lib/axios'

export const usersApi = {
  // Self
  getMe:            ()     => api.get('/api/users/me'),
  updateMe:         (data) => api.patch('/api/users/me', data),
  changePassword:   (data) => api.patch('/api/users/me/password', data),
  // Org
  getOrg:           ()     => api.get('/api/users/org'),
  updateOrg:        (data) => api.patch('/api/users/org', data),
  // Users (manager)
  listUsers:        (p)    => api.get('/api/users', { params: p }),
  changeRole:       (id, role) => api.patch(`/api/users/${id}/role`, { role }),
  deactivateUser:   (id)   => api.patch(`/api/users/${id}/deactivate`),
  reactivateUser:   (id)   => api.patch(`/api/users/${id}/reactivate`),
  // Invites (manager)
  listInvites:      (p)    => api.get('/api/users/invites', { params: p }),
  sendInvite:       (data) => api.post('/api/auth/invites', data),
  revokeInvite:     (id)   => api.delete(`/api/users/invites/${id}`),
}

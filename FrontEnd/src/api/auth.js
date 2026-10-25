import { privateApi, publicApi } from './client.js'

export const authApi = {
  register: (formData) => publicApi.post('/users/register', formData),
  login: (credentials) => publicApi.post('/users/login', credentials),
  logout: () => privateApi.post('/users/logout'),
  refresh: () => publicApi.post('/users/refresh-token'),
  currentUser: () => privateApi.get('/users/current-user'),
  updateAccount: (details) => privateApi.patch('/users/update-account', details),
  updateAvatar: (formData) => privateApi.patch('/users/avatar', formData),
  updateCoverImage: (formData) => privateApi.patch('/users/cover-image', formData),
  changePassword: (passwords) => privateApi.post('/users/change-password', passwords),
  history: () => privateApi.get('/users/history'),
  channel: (username) => privateApi.get(`/users/c/${encodeURIComponent(username)}`),
}

import { privateApi, publicApi } from './client.js'

export const authApi = {
  register: (formData) => publicApi.post('/users/register', formData),
  login: (credentials) => publicApi.post('/users/login', credentials),
  logout: () => privateApi.post('/users/logout'),
  refresh: () => publicApi.post('/users/refresh-token'),
  currentUser: () => privateApi.get('/users/current-user'),
}

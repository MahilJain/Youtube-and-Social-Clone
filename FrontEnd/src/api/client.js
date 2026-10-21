import axios from 'axios'
import { clearCredentials, setCredentials, store } from '../app/store.js'

const baseURL = import.meta.env.VITE_API_BASE_URL

export const publicApi = axios.create({
  baseURL,
  withCredentials: true,
})

export const privateApi = axios.create({
  baseURL,
  withCredentials: true,
})

let refreshRequest

privateApi.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

privateApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    try {
      refreshRequest ??= publicApi
        .post('/users/refresh-token')
        .then(({ data }) => {
          const credentials = data.data
          store.dispatch(setCredentials({ accessToken: credentials.accessToken }))
          return credentials.accessToken
        })
        .finally(() => {
          refreshRequest = undefined
        })

      const accessToken = await refreshRequest
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return privateApi(originalRequest)
    } catch (refreshError) {
      store.dispatch(clearCredentials())
      return Promise.reject(refreshError)
    }
  },
)

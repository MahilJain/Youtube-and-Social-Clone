import { privateApi, publicApi } from './client.js'

export const videosApi = {
  list: (params) => publicApi.get('/videos', { params }),
  getById: (videoId) => publicApi.get(`/videos/${videoId}`),
  publish: (formData, config) => privateApi.post('/videos/publish', formData, config),
  update: (videoId, payload) => privateApi.patch(`/videos/${videoId}`, payload),
  remove: (videoId) => privateApi.delete(`/videos/${videoId}`),
  togglePublish: (videoId) => privateApi.patch(`/videos/toggle-publish/${videoId}`),
}

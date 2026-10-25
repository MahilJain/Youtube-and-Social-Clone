import { privateApi, publicApi } from './client.js'

export const commentsApi = {
  list: (videoId, params) => publicApi.get(`/comments/${videoId}`, { params }),
  create: (videoId, payload) => privateApi.post(`/comments/${videoId}`, payload),
  update: (commentId, payload) =>
    privateApi.patch(`/comments/c/${commentId}`, payload),
  remove: (commentId) => privateApi.delete(`/comments/c/${commentId}`),
}

export const likesApi = {
  toggleVideo: (videoId) => privateApi.post(`/likes/toggle/v/${videoId}`),
  toggleComment: (commentId) => privateApi.post(`/likes/toggle/c/${commentId}`),
  toggleTweet: (tweetId) => privateApi.post(`/likes/toggle/t/${tweetId}`),
  videos: () => privateApi.get('/likes/videos'),
}

export const subscriptionsApi = {
  toggle: (channelId) => privateApi.post(`/subscriptions/toggle/${channelId}`),
  channels: (userId) => privateApi.get(`/subscriptions/user/${userId}/channels`),
  subscribers: (channelId) =>
    privateApi.get(`/subscriptions/channel/${channelId}/subscribers`),
}

export const playlistsApi = {
  list: (userId) => privateApi.get(`/playlists/user/${userId}`),
  get: (playlistId) => privateApi.get(`/playlists/${playlistId}`),
  create: (payload) => privateApi.post('/playlists', payload),
  update: (playlistId, payload) =>
    privateApi.patch(`/playlists/${playlistId}`, payload),
  remove: (playlistId) => privateApi.delete(`/playlists/${playlistId}`),
  addVideo: (playlistId, videoId) =>
    privateApi.post(`/playlists/${playlistId}/videos/${videoId}`),
  removeVideo: (playlistId, videoId) =>
    privateApi.delete(`/playlists/${playlistId}/videos/${videoId}`),
}

export const dashboardApi = {
  stats: () => privateApi.get('/dashboard/stats'),
  videos: () => privateApi.get('/dashboard/videos'),
}

export const tweetsApi = {
  list: (userId) => privateApi.get(`/tweets/user/${userId}`),
  create: (payload) => privateApi.post('/tweets', payload),
  update: (tweetId, payload) => privateApi.patch(`/tweets/${tweetId}`, payload),
  remove: (tweetId) => privateApi.delete(`/tweets/${tweetId}`),
}

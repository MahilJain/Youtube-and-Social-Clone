import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { playlistsApi } from '../api/community.js'
import { useCurrentUser } from '../app/useCurrentUser.js'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/VideoGrid.jsx'

function Playlists() {
  const { user, isLoading } = useCurrentUser()
  const [error, setError] = useState(null)
  const [editingPlaylist, setEditingPlaylist] = useState(null)
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['playlists', user?._id],
    queryFn: () => playlistsApi.list(user._id),
    enabled: Boolean(user),
  })
  const createMutation = useMutation({
    mutationFn: playlistsApi.create,
    onSuccess: () => {
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['playlists', user._id] })
    },
    onError: setError,
  })
  const deleteMutation = useMutation({
    mutationFn: playlistsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlists', user._id] }),
  })
  const removeVideoMutation = useMutation({
    mutationFn: ({ playlistId, videoId }) =>
      playlistsApi.removeVideo(playlistId, videoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlists', user._id] }),
  })
  const updateMutation = useMutation({
    mutationFn: ({ playlistId, payload }) =>
      playlistsApi.update(playlistId, payload),
    onSuccess: () => {
      setEditingPlaylist(null)
      queryClient.invalidateQueries({ queryKey: ['playlists', user._id] })
    },
  })
  const playlists = query.data?.data.data ?? []

  if (isLoading) return <LoadingState>Checking your session…</LoadingState>
  if (!user) {
    return (
      <section className="mx-auto max-w-xl py-16 text-center">
        <h1 className="text-2xl font-bold">Your playlists</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Sign in to create and manage playlists.</p>
        <Link to="/login" className="mt-5 inline-flex rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white">Sign in</Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold tracking-tight">Your playlists</h1>
      <form
        className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          createMutation.mutate({
            name: form.get('name'),
            description: form.get('description'),
          })
          event.currentTarget.reset()
        }}
      >
        <input name="name" required maxLength="100" placeholder="Playlist name" aria-label="Playlist name" className="min-w-40 flex-1 rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700" />
        <input name="description" placeholder="Description (optional)" aria-label="Playlist description" className="min-w-40 flex-1 rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700" />
        <button disabled={createMutation.isPending} className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {createMutation.isPending ? 'Creating…' : 'Create playlist'}
        </button>
      </form>
      {(error || deleteMutation.isError || removeVideoMutation.isError || updateMutation.isError) && <div className="mt-4"><ErrorState error={error || deleteMutation.error || removeVideoMutation.error || updateMutation.error} /></div>}
      {query.isPending && <LoadingState>Loading playlists…</LoadingState>}
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      {!query.isPending && !query.isError && playlists.length === 0 && <div className="mt-6"><EmptyState>Create a playlist to save videos for later.</EmptyState></div>}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {playlists.map((playlist) => (
          <article key={playlist._id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-4 p-5">
              {editingPlaylist === playlist._id ? (
                <form className="grid w-full gap-2" onSubmit={(event) => {
                  event.preventDefault()
                  const form = new FormData(event.currentTarget)
                  updateMutation.mutate({
                    playlistId: playlist._id,
                    payload: {
                      name: form.get('name'),
                      description: form.get('description'),
                    },
                  })
                }}>
                  <input name="name" defaultValue={playlist.name} required aria-label="Playlist name" className="rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700" />
                  <input name="description" defaultValue={playlist.description} aria-label="Playlist description" className="rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700" />
                  <div className="flex gap-2">
                    <button disabled={updateMutation.isPending} className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">{updateMutation.isPending ? 'Saving…' : 'Save changes'}</button>
                    <button type="button" onClick={() => setEditingPlaylist(null)} className="rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <h2 className="font-bold">{playlist.name}</h2>
                    <p className="mt-1 text-sm text-zinc-500">{playlist.description || 'No description'} · {playlist.videos?.length || 0} videos</p>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setEditingPlaylist(playlist._id)} className="text-sm font-semibold hover:text-rose-600">Edit</button>
                    <button type="button" disabled={deleteMutation.isPending} onClick={() => {
                      if (window.confirm(`Delete playlist “${playlist.name}”?`)) deleteMutation.mutate(playlist._id)
                    }} className="text-sm font-semibold text-rose-600 hover:underline">Delete</button>
                  </div>
                </>
              )}
            </div>
            {playlist.videos?.length > 0 ? (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {playlist.videos.map((video) => (
                  <div key={video._id} className="flex items-center gap-3 p-3">
                    <Link to={`/watch/${video._id}`} className="h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-200">
                      <img src={video.thumbnail} alt="" className="size-full object-cover" />
                    </Link>
                    <Link to={`/watch/${video._id}`} className="line-clamp-2 flex-1 text-sm font-medium hover:text-rose-600">{video.title}</Link>
                    <button type="button" disabled={removeVideoMutation.isPending} onClick={() => removeVideoMutation.mutate({ playlistId: playlist._id, videoId: video._id })} className="px-2 text-sm text-zinc-500 hover:text-rose-600" aria-label={`Remove ${video.title} from playlist`}>×</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="border-t border-zinc-200 px-5 py-4 text-sm text-zinc-500 dark:border-zinc-800">Save videos from their watch page.</p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default Playlists

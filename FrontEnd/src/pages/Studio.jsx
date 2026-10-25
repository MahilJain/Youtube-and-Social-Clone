import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../api/community.js'
import { useCurrentUser } from '../app/useCurrentUser.js'
import { videosApi } from '../api/videos.js'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/VideoGrid.jsx'

const stats = [
  ['totalViews', 'Total views'],
  ['totalSubscribers', 'Subscribers'],
  ['totalVideos', 'Videos'],
  ['totalLikes', 'Likes'],
]

function Studio() {
  const { user, isLoading: isUserLoading } = useCurrentUser()
  const queryClient = useQueryClient()
  const statsQuery = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.stats,
    enabled: Boolean(user),
  })
  const videosQuery = useQuery({
    queryKey: ['dashboard', 'videos'],
    queryFn: dashboardApi.videos,
    enabled: Boolean(user),
  })
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['videos'] })
  }
  const toggleMutation = useMutation({
    mutationFn: videosApi.togglePublish,
    onSuccess: refresh,
  })
  const deleteMutation = useMutation({
    mutationFn: videosApi.remove,
    onSuccess: refresh,
  })
  const dashboardStats = statsQuery.data?.data.data
  const videos = videosQuery.data?.data.data ?? []

  if (isUserLoading) return <LoadingState>Checking your session…</LoadingState>
  if (!user) {
    return (
      <section className="mx-auto max-w-xl py-16 text-center">
        <h1 className="text-2xl font-bold">Your creator studio</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Sign in to manage your videos and channel.</p>
        <Link to="/login" className="mt-5 inline-flex rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white">Sign in</Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-400">Creator studio</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Channel overview</h1>
        </div>
        <Link to="/upload" className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">＋ Upload video</Link>
      </div>

      {statsQuery.isError && <div className="mt-6"><ErrorState error={statsQuery.error} onRetry={() => statsQuery.refetch()} /></div>}
      {statsQuery.isPending ? <LoadingState>Loading channel stats…</LoadingState> : dashboardStats && (
        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(([key, label]) => (
            <div key={key} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
              <p className="mt-2 text-2xl font-bold">{new Intl.NumberFormat().format(dashboardStats[key] || 0)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Your videos</h2>
        <Link to={`/channel/${user.username}`} className="text-sm font-semibold text-rose-600 hover:underline">View your channel</Link>
      </div>
      {videosQuery.isPending && <LoadingState>Loading your videos…</LoadingState>}
      {videosQuery.isError && <ErrorState error={videosQuery.error} onRetry={() => videosQuery.refetch()} />}
      {!videosQuery.isPending && !videosQuery.isError && videos.length === 0 && (
        <div className="mt-4"><EmptyState>Publish your first video to see it here.</EmptyState></div>
      )}
      {videos.length > 0 && (
        <div className="mt-4 space-y-3">
          {videos.map((video) => (
            <article key={video._id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <Link to={`/watch/${video._id}`} className="h-20 w-36 shrink-0 overflow-hidden rounded-xl bg-zinc-200">
                <img src={video.thumbnail} alt="" className="size-full object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/watch/${video._id}`} className="font-semibold hover:text-rose-600">{video.title}</Link>
                <p className="mt-1 text-sm text-zinc-500">
                  {new Intl.NumberFormat().format(video.views || 0)} views · {video.isPublished ? 'Published' : 'Unlisted'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={toggleMutation.isPending}
                  onClick={() => toggleMutation.mutate(video._id)}
                  className="rounded-full border border-zinc-300 px-3 py-2 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  {video.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Delete “${video.title}”? This cannot be undone.`)) {
                      deleteMutation.mutate(video._id)
                    }
                  }}
                  className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {(toggleMutation.isError || deleteMutation.isError) && (
        <div className="mt-4"><ErrorState error={toggleMutation.error || deleteMutation.error} /></div>
      )}
    </section>
  )
}

export default Studio

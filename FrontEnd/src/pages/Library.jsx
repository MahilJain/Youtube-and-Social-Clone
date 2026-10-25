import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { authApi } from '../api/auth.js'
import { likesApi, subscriptionsApi } from '../api/community.js'
import { useCurrentUser } from '../app/useCurrentUser.js'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  VideoGrid,
} from '../components/VideoGrid.jsx'

function SignInPrompt() {
  return (
    <div className="rounded-2xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
      <p className="font-semibold">Sign in to see your library</p>
      <Link to="/login" className="mt-4 inline-flex rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white">
        Sign in
      </Link>
    </div>
  )
}

function ChannelList({ channels }) {
  if (!channels.length) return <EmptyState>You haven’t followed any channels yet.</EmptyState>
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {channels.map(({ channel }) => (
        <Link
          key={channel._id}
          to={`/channel/${channel.username}`}
          className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 hover:border-rose-300 dark:border-zinc-800 dark:bg-zinc-900"
        >
          {channel.avatar && <img src={channel.avatar} alt="" className="size-14 rounded-full object-cover" />}
          <span className="min-w-0">
            <span className="block truncate font-semibold">{channel.fullName}</span>
            <span className="block truncate text-sm text-zinc-500">@{channel.username}</span>
          </span>
        </Link>
      ))}
    </div>
  )
}

function Library({ kind }) {
  const { user, isLoading: isUserLoading } = useCurrentUser()
  const config = {
    history: {
      title: 'Watch history',
      queryKey: ['library', 'history'],
      queryFn: () => authApi.history(),
    },
    liked: {
      title: 'Liked videos',
      queryKey: ['library', 'liked'],
      queryFn: () => likesApi.videos(),
    },
    subscriptions: {
      title: 'Subscriptions',
      queryKey: ['library', 'subscriptions', user?._id],
      queryFn: () => subscriptionsApi.channels(user._id),
    },
  }[kind]
  const query = useQuery({
    queryKey: config.queryKey,
    queryFn: config.queryFn,
    enabled: Boolean(user),
  })
  const items = query.data?.data.data ?? []

  return (
    <section className="mx-auto max-w-7xl">
      <h1 className="mb-7 text-2xl font-bold tracking-tight">{config.title}</h1>
      {isUserLoading && <LoadingState>Checking your session…</LoadingState>}
      {!isUserLoading && !user && <SignInPrompt />}
      {user && query.isPending && <LoadingState>Loading your library…</LoadingState>}
      {user && query.isError && (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      )}
      {user && !query.isPending && !query.isError && kind === 'subscriptions' && (
        <ChannelList channels={items} />
      )}
      {user && !query.isPending && !query.isError && kind !== 'subscriptions' && (
        items.length ? <VideoGrid videos={items} /> : (
          <EmptyState>
            {kind === 'history'
              ? 'Videos you watch will appear here.'
              : 'Videos you like will appear here.'}
          </EmptyState>
        )
      )}
    </section>
  )
}

export const History = () => <Library kind="history" />
export const Liked = () => <Library kind="liked" />
export const Subscriptions = () => <Library kind="subscriptions" />

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { authApi } from '../api/auth.js'
import { likesApi, subscriptionsApi, tweetsApi } from '../api/community.js'
import { videosApi } from '../api/videos.js'
import { useCurrentUser } from '../app/useCurrentUser.js'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  VideoGrid,
} from '../components/VideoGrid.jsx'

function Channel() {
  const { username } = useParams()
  const { user, isLoading: isUserLoading } = useCurrentUser()
  const queryClient = useQueryClient()
  const [post, setPost] = useState('')
  const [editingTweet, setEditingTweet] = useState(null)
  const [editedContent, setEditedContent] = useState('')
  const [tweetLikes, setTweetLikes] = useState({})
  const profileQuery = useQuery({
    queryKey: ['channel', username],
    queryFn: () => authApi.channel(username),
    enabled: Boolean(user && username),
  })
  const profile = profileQuery.data?.data.data
  const videosQuery = useQuery({
    queryKey: ['videos', 'channel', profile?._id],
    queryFn: () => videosApi.list({ userId: profile._id, limit: 24 }),
    enabled: Boolean(profile?._id),
  })
  const tweetsQuery = useQuery({
    queryKey: ['tweets', profile?._id],
    queryFn: () => tweetsApi.list(profile._id),
    enabled: Boolean(profile?._id),
  })
  const subscribeMutation = useMutation({
    mutationFn: () => subscriptionsApi.toggle(profile._id),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(['channel', username], (current) => ({
        ...current,
        data: {
          ...current.data,
          data: {
            ...current.data.data,
            isSubscribed: data.data.subscribed,
            subscribersCount: Math.max(
              0,
              current.data.data.subscribersCount + (data.data.subscribed ? 1 : -1),
            ),
          },
        },
      }))
      queryClient.invalidateQueries({ queryKey: ['library', 'subscriptions'] })
    },
  })
  const postMutation = useMutation({
    mutationFn: tweetsApi.create,
    onSuccess: () => {
      setPost('')
      queryClient.invalidateQueries({ queryKey: ['tweets', profile._id] })
    },
  })
  const deletePostMutation = useMutation({
    mutationFn: tweetsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tweets', profile._id] }),
  })
  const updatePostMutation = useMutation({
    mutationFn: ({ tweetId, content }) => tweetsApi.update(tweetId, { content }),
    onSuccess: () => {
      setEditingTweet(null)
      queryClient.invalidateQueries({ queryKey: ['tweets', profile._id] })
    },
  })
  const likePostMutation = useMutation({
    mutationFn: likesApi.toggleTweet,
    onSuccess: ({ data }, tweetId) =>
      setTweetLikes((current) => ({ ...current, [tweetId]: data.data.liked })),
  })

  if (isUserLoading) return <LoadingState>Checking your session…</LoadingState>
  if (!user) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="text-2xl font-bold">Sign in to view channels</h1>
        <Link to="/login" className="mt-5 inline-flex rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white">Sign in</Link>
      </div>
    )
  }
  if (profileQuery.isPending) return <LoadingState>Loading channel…</LoadingState>
  if (profileQuery.isError) {
    return <div className="mx-auto max-w-3xl"><ErrorState error={profileQuery.error} onRetry={() => profileQuery.refetch()} /></div>
  }
  if (!profile) return <EmptyState>Channel not found.</EmptyState>

  const isOwnChannel = profile._id === user._id
  const videos = videosQuery.data?.data.data.videos ?? []
  const posts = tweetsQuery.data?.data.data ?? []

  return (
    <section className="mx-auto max-w-6xl">
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-36 bg-gradient-to-br from-rose-700 via-rose-600 to-orange-400 sm:h-52">
          {profile.coverImage && <img src={profile.coverImage} alt="" className="size-full object-cover" />}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-5 sm:px-8">
          <div className="-mt-10 flex items-end gap-4 sm:-mt-12">
            <img src={profile.avatar} alt="" className="size-20 rounded-full border-4 border-white bg-zinc-200 object-cover dark:border-zinc-900 sm:size-24" />
            <div className="pb-1">
              <h1 className="text-xl font-bold sm:text-2xl">{profile.fullName}</h1>
              <p className="text-sm text-zinc-500">@{profile.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {new Intl.NumberFormat().format(profile.subscribersCount || 0)} subscribers
            </p>
            {isOwnChannel ? (
              <Link to="/settings" className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold dark:border-zinc-700">Edit profile</Link>
            ) : (
              <button
                type="button"
                disabled={subscribeMutation.isPending}
                onClick={() => subscribeMutation.mutate()}
                className={`rounded-full px-5 py-2 text-sm font-semibold ${profile.isSubscribed ? 'border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800' : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'}`}
              >
                {subscribeMutation.isPending ? 'Updating…' : profile.isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            )}
          </div>
        </div>
      </div>
      {subscribeMutation.isError && <div className="mt-4"><ErrorState error={subscribeMutation.error} /></div>}

      <div className="mt-9">
        <h2 className="mb-5 text-xl font-bold">Videos</h2>
        {videosQuery.isPending && <LoadingState>Loading videos…</LoadingState>}
        {videosQuery.isError && <ErrorState error={videosQuery.error} onRetry={() => videosQuery.refetch()} />}
        {!videosQuery.isPending && !videosQuery.isError && (videos.length ? <VideoGrid videos={videos} /> : <EmptyState>This channel hasn’t published videos yet.</EmptyState>)}
      </div>

      <div className="mt-10">
        <h2 className="mb-5 text-xl font-bold">Community</h2>
        {isOwnChannel && (
          <form
            className="mb-5 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            onSubmit={(event) => {
              event.preventDefault()
              if (post.trim()) postMutation.mutate({ content: post.trim() })
            }}
          >
            <label htmlFor="channel-post" className="sr-only">Write a community post</label>
            <textarea id="channel-post" value={post} onChange={(event) => setPost(event.target.value)} maxLength="500" rows="3" placeholder="Share an update with your community…" className="w-full resize-y bg-transparent text-sm outline-none" />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-zinc-500">{post.length}/500</span>
              <button disabled={postMutation.isPending || !post.trim()} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {postMutation.isPending ? 'Posting…' : 'Post'}
              </button>
            </div>
          </form>
        )}
        {tweetsQuery.isPending && <LoadingState>Loading posts…</LoadingState>}
        {tweetsQuery.isError && <ErrorState error={tweetsQuery.error} onRetry={() => tweetsQuery.refetch()} />}
        {!tweetsQuery.isPending && !tweetsQuery.isError && posts.length === 0 && <EmptyState>No community posts yet.</EmptyState>}
        <div className="space-y-3">
          {posts.map((tweet) => (
            <article key={tweet._id} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              {editingTweet === tweet._id ? (
                <form onSubmit={(event) => {
                  event.preventDefault()
                  if (editedContent.trim()) updatePostMutation.mutate({ tweetId: tweet._id, content: editedContent.trim() })
                }}>
                  <textarea value={editedContent} onChange={(event) => setEditedContent(event.target.value)} maxLength="500" rows="3" className="w-full rounded-xl border border-zinc-300 bg-transparent p-3 text-sm dark:border-zinc-700" />
                  <div className="mt-2 flex gap-2">
                    <button disabled={!editedContent.trim() || updatePostMutation.isPending} className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">Save</button>
                    <button type="button" onClick={() => setEditingTweet(null)} className="rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
                  </div>
                </form>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-6">{tweet.content}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                <time dateTime={tweet.createdAt}>{tweet.createdAt ? new Date(tweet.createdAt).toLocaleDateString() : ''}</time>
                <div className="flex items-center gap-4">
                  <button type="button" disabled={likePostMutation.isPending} onClick={() => likePostMutation.mutate(tweet._id)} className="font-semibold hover:text-rose-600">{tweetLikes[tweet._id] ? '♥ Liked' : '♡ Like'}</button>
                  {tweet.owner?._id === user._id && (
                    <>
                      {editingTweet !== tweet._id && <button type="button" onClick={() => { setEditingTweet(tweet._id); setEditedContent(tweet.content) }} className="font-semibold hover:text-rose-600">Edit</button>}
                      <button type="button" onClick={() => deletePostMutation.mutate(tweet._id)} className="font-semibold text-rose-600 hover:underline">Delete</button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
        {(postMutation.isError || deletePostMutation.isError || updatePostMutation.isError || likePostMutation.isError) && (
          <div className="mt-4"><ErrorState error={postMutation.error || deletePostMutation.error || updatePostMutation.error || likePostMutation.error} /></div>
        )}
      </div>
    </section>
  )
}

export default Channel

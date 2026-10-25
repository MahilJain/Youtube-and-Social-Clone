import { useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
  commentsApi,
  likesApi,
  playlistsApi,
} from '../api/community.js'
import { useCurrentUser } from '../app/useCurrentUser.js'
import { videosApi } from '../api/videos.js'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/VideoGrid.jsx'

function Watch() {
  const { videoId } = useParams()
  const { user } = useCurrentUser()
  const queryClient = useQueryClient()
  const [commentText, setCommentText] = useState('')
  const [editingComment, setEditingComment] = useState(null)
  const [editedText, setEditedText] = useState('')
  const [liked, setLiked] = useState(null)
  const [showPlaylists, setShowPlaylists] = useState(false)
  const [playlistName, setPlaylistName] = useState('')
  const [playlistMessage, setPlaylistMessage] = useState('')
  const [commentLikes, setCommentLikes] = useState({})

  const videoQuery = useQuery({
    queryKey: ['videos', videoId],
    queryFn: () => videosApi.getById(videoId),
    enabled: Boolean(videoId),
  })
  const video = videoQuery.data?.data.data
  const commentsQuery = useInfiniteQuery({
    queryKey: ['comments', videoId],
    queryFn: ({ pageParam }) =>
      commentsApi.list(videoId, { page: pageParam, limit: 10 }),
    initialPageParam: 1,
    enabled: Boolean(videoId && video),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.data.data.pagination
      return pagination.page < pagination.totalPages
        ? pagination.page + 1
        : undefined
    },
  })
  const playlistsQuery = useQuery({
    queryKey: ['playlists', user?._id],
    queryFn: () => playlistsApi.list(user._id),
    enabled: Boolean(user && showPlaylists),
  })
  const likeMutation = useMutation({
    mutationFn: () => likesApi.toggleVideo(videoId),
    onSuccess: ({ data }) => setLiked(data.data.liked),
  })
  const commentMutation = useMutation({
    mutationFn: (content) => commentsApi.create(videoId, { content }),
    onSuccess: () => {
      setCommentText('')
      queryClient.invalidateQueries({ queryKey: ['comments', videoId] })
    },
  })
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }) => commentsApi.update(commentId, { content }),
    onSuccess: () => {
      setEditingComment(null)
      setEditedText('')
      queryClient.invalidateQueries({ queryKey: ['comments', videoId] })
    },
  })
  const deleteCommentMutation = useMutation({
    mutationFn: commentsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', videoId] }),
  })
  const commentLikeMutation = useMutation({
    mutationFn: likesApi.toggleComment,
    onSuccess: ({ data }, commentId) =>
      setCommentLikes((current) => ({ ...current, [commentId]: data.data.liked })),
  })
  const addToPlaylistMutation = useMutation({
    mutationFn: (playlistId) => playlistsApi.addVideo(playlistId, videoId),
    onSuccess: () => {
      setPlaylistMessage('Saved to playlist.')
      queryClient.invalidateQueries({ queryKey: ['playlists', user?._id] })
    },
  })
  const createPlaylistMutation = useMutation({
    mutationFn: async (name) => {
      const created = await playlistsApi.create({ name })
      return playlistsApi.addVideo(created.data.data._id, videoId)
    },
    onSuccess: () => {
      setPlaylistName('')
      setPlaylistMessage('Playlist created and video saved.')
      queryClient.invalidateQueries({ queryKey: ['playlists', user?._id] })
    },
  })

  if (videoQuery.isPending) return <LoadingState>Loading video…</LoadingState>
  if (videoQuery.isError || !video) {
    return (
      <section className="mx-auto max-w-3xl py-16 text-center">
        <h1 className="text-xl font-bold">Video unavailable</h1>
        <p role="alert" className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {videoQuery.error?.response?.data?.message || 'This video could not be loaded.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={() => videoQuery.refetch()} className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold dark:border-zinc-700">Try again</button>
          <Link to="/" className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900">Back to videos</Link>
        </div>
      </section>
    )
  }

  const comments = commentsQuery.data?.pages.flatMap((page) => page.data.data.comments) ?? []

  return (
    <article className="mx-auto max-w-5xl">
      <Link to="/" className="mb-4 inline-flex text-sm font-medium text-zinc-600 hover:text-rose-600 dark:text-zinc-400">← Back to videos</Link>
      <video className="aspect-video w-full rounded-2xl bg-black" controls playsInline preload="metadata" poster={video.thumbnail}>
        <source src={video.videoFile} />
        Your browser does not support video playback.
      </video>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">{video.title}</h1>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          {video.owner?.avatar && <Link to={`/channel/${video.owner.username}`}><img src={video.owner.avatar} alt="" className="size-11 rounded-full object-cover" /></Link>}
          <div>
            <Link to={`/channel/${video.owner?.username}`} className="font-semibold hover:text-rose-600">{video.owner?.fullName || video.owner?.username || 'Unknown creator'}</Link>
            {video.owner?.username && <p className="text-sm text-zinc-600 dark:text-zinc-400">@{video.owner.username}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {new Intl.NumberFormat(undefined, { notation: 'compact' }).format(video.views || 0)} views
            {video.createdAt ? ` · ${new Date(video.createdAt).toLocaleDateString()}` : ''}
          </p>
          {user ? (
            <>
              <button type="button" disabled={likeMutation.isPending} onClick={() => likeMutation.mutate()} className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                {likeMutation.isPending ? 'Saving…' : liked ? '♥ Liked' : '♡ Like'}
              </button>
              <button type="button" onClick={() => { setShowPlaylists((shown) => !shown); setPlaylistMessage('') }} className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                Save
              </button>
            </>
          ) : (
            <Link to="/login" state={{ from: `/watch/${videoId}` }} className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold dark:border-zinc-700">Sign in to like or save</Link>
          )}
        </div>
      </div>
      {likeMutation.isError && <div className="mt-4"><ErrorState error={likeMutation.error} /></div>}
      {showPlaylists && user && (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-semibold">Save to a playlist</h2>
          {playlistMessage && <p role="status" className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">{playlistMessage}</p>}
          {playlistsQuery.isPending && <p className="mt-3 text-sm text-zinc-500">Loading playlists…</p>}
          {playlistsQuery.isError && <ErrorState error={playlistsQuery.error} onRetry={() => playlistsQuery.refetch()} />}
          <div className="mt-3 flex flex-wrap gap-2">
            {(playlistsQuery.data?.data.data ?? []).map((playlist) => (
              <button key={playlist._id} type="button" disabled={addToPlaylistMutation.isPending} onClick={() => addToPlaylistMutation.mutate(playlist._id)} className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                {playlist.name}
              </button>
            ))}
          </div>
          <form className="mt-4 flex gap-2" onSubmit={(event) => {
            event.preventDefault()
            if (playlistName.trim()) createPlaylistMutation.mutate(playlistName.trim())
          }}>
            <input value={playlistName} onChange={(event) => setPlaylistName(event.target.value)} maxLength="100" placeholder="Create a new playlist" aria-label="New playlist name" className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700" />
            <button disabled={!playlistName.trim() || createPlaylistMutation.isPending} className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900">
              {createPlaylistMutation.isPending ? 'Saving…' : 'Create & save'}
            </button>
          </form>
          {(addToPlaylistMutation.isError || createPlaylistMutation.isError) && (
            <div className="mt-3"><ErrorState error={addToPlaylistMutation.error || createPlaylistMutation.error} /></div>
          )}
        </div>
      )}
      {video.description && <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-zinc-100 p-4 text-sm leading-6 dark:bg-zinc-900">{video.description}</p>}

      <section className="mt-9">
        <h2 className="text-xl font-bold">Comments</h2>
        {user ? (
          <form className="mt-4 flex items-start gap-3" onSubmit={(event) => {
            event.preventDefault()
            if (commentText.trim()) commentMutation.mutate(commentText.trim())
          }}>
            {user.avatar && <img src={user.avatar} alt="" className="size-10 rounded-full object-cover" />}
            <div className="min-w-0 flex-1">
              <label htmlFor="new-comment" className="sr-only">Add a comment</label>
              <textarea id="new-comment" value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength="2000" rows="2" placeholder="Add a comment…" className="w-full resize-y border-b border-zinc-300 bg-transparent px-1 py-2 text-sm outline-none focus:border-rose-600 dark:border-zinc-700" />
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setCommentText('')} className="rounded-full px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
                <button disabled={!commentText.trim() || commentMutation.isPending} className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900">{commentMutation.isPending ? 'Commenting…' : 'Comment'}</button>
              </div>
            </div>
          </form>
        ) : (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400"><Link to="/login" state={{ from: `/watch/${videoId}` }} className="font-semibold text-rose-600">Sign in</Link> to join the conversation.</p>
        )}
        {(commentMutation.isError || updateCommentMutation.isError || deleteCommentMutation.isError) && (
          <div className="mt-4"><ErrorState error={commentMutation.error || updateCommentMutation.error || deleteCommentMutation.error} /></div>
        )}
        {commentsQuery.isPending && <LoadingState>Loading comments…</LoadingState>}
        {commentsQuery.isError && <div className="mt-4"><ErrorState error={commentsQuery.error} onRetry={() => commentsQuery.refetch()} /></div>}
        {!commentsQuery.isPending && !commentsQuery.isError && comments.length === 0 && <div className="mt-4"><EmptyState>Be the first to comment.</EmptyState></div>}
        <div className="mt-5 space-y-5">
          {comments.map((comment) => {
            const isOwner = user && (comment.owner?._id === user._id || comment.owner === user._id)
            return (
              <article key={comment._id} className="flex gap-3">
                {comment.owner?.avatar ? <img src={comment.owner.avatar} alt="" className="size-10 shrink-0 rounded-full object-cover" /> : <span className="grid size-10 shrink-0 place-items-center rounded-full bg-zinc-200 text-sm dark:bg-zinc-800">{comment.owner?.username?.[0]?.toUpperCase() || '?'}</span>}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-500">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{comment.owner?.fullName || comment.owner?.username || 'User'}</span>
                    {comment.createdAt && ` · ${new Date(comment.createdAt).toLocaleDateString()}`}
                  </p>
                  {editingComment === comment._id ? (
                    <form className="mt-2" onSubmit={(event) => {
                      event.preventDefault()
                      if (editedText.trim()) updateCommentMutation.mutate({ commentId: comment._id, content: editedText.trim() })
                    }}>
                      <textarea value={editedText} onChange={(event) => setEditedText(event.target.value)} rows="2" className="w-full rounded-xl border border-zinc-300 bg-transparent p-3 text-sm dark:border-zinc-700" />
                      <div className="mt-2 flex gap-2">
                        <button disabled={!editedText.trim() || updateCommentMutation.isPending} className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">Save</button>
                        <button type="button" onClick={() => setEditingComment(null)} className="rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{comment.content}</p>
                  )}
                  <div className="mt-2 flex items-center gap-4">
                    {user && (
                      <button type="button" disabled={commentLikeMutation.isPending} onClick={() => commentLikeMutation.mutate(comment._id)} className="text-xs font-medium text-zinc-500 hover:text-rose-600">
                        {commentLikes[comment._id] ? '♥ Liked' : '♡ Like'}
                      </button>
                    )}
                    {isOwner && editingComment !== comment._id && (
                      <>
                        <button type="button" onClick={() => { setEditingComment(comment._id); setEditedText(comment.content) }} className="text-xs font-medium text-zinc-500 hover:text-rose-600">Edit</button>
                        <button type="button" disabled={deleteCommentMutation.isPending} onClick={() => deleteCommentMutation.mutate(comment._id)} className="text-xs font-medium text-zinc-500 hover:text-rose-600">Delete</button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
        {commentsQuery.hasNextPage && (
          <button type="button" disabled={commentsQuery.isFetchingNextPage} onClick={() => commentsQuery.fetchNextPage()} className="mt-6 rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold dark:border-zinc-700">
            {commentsQuery.isFetchingNextPage ? 'Loading…' : 'More comments'}
          </button>
        )}
        {(commentLikeMutation.isError || addToPlaylistMutation.isError || createPlaylistMutation.isError) && (
          <div className="mt-4"><ErrorState error={commentLikeMutation.error || addToPlaylistMutation.error || createPlaylistMutation.error} /></div>
        )}
      </section>
    </article>
  )
}

export default Watch

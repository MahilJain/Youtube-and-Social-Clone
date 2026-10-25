import { useInfiniteQuery } from '@tanstack/react-query'
import { videosApi } from '../api/videos.js'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  VideoGrid,
} from '../components/VideoGrid.jsx'

function Home() {
  const query = useInfiniteQuery({
    queryKey: ['videos', 'feed'],
    queryFn: ({ pageParam }) => videosApi.list({ page: pageParam, limit: 12 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.data.data.pagination
      return pagination.page < pagination.totalPages
        ? pagination.page + 1
        : undefined
    },
  })
  const videos = query.data?.pages.flatMap((page) => page.data.data.videos) ?? []

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-400">
          Streamline
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Explore videos</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Discover the latest videos from the community.
        </p>
      </div>

      {query.isPending && <LoadingState>Loading videos…</LoadingState>}
      {query.isError && videos.length === 0 && (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      )}
      {!query.isPending && !query.isError && videos.length === 0 && (
        <EmptyState>There are no published videos yet.</EmptyState>
      )}

      {videos.length > 0 && (
        <>
          <VideoGrid videos={videos} />
          {query.isFetchNextPageError && (
            <p role="alert" className="mt-6 text-center text-sm text-rose-700 dark:text-rose-300">
              Could not load more videos. Try again.
            </p>
          )}
          {query.hasNextPage && (
            <div className="mt-9 text-center">
              <button
                type="button"
                onClick={() => query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
                className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {query.isFetchingNextPage
                  ? 'Loading…'
                  : query.isFetchNextPageError
                    ? 'Try loading more'
                    : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default Home

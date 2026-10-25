import { useInfiniteQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { videosApi } from '../api/videos.js'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  VideoGrid,
} from '../components/VideoGrid.jsx'

function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q')?.trim() || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortType = searchParams.get('sortType') || 'desc'
  const query = useInfiniteQuery({
    queryKey: ['videos', 'search', search, sortBy, sortType],
    queryFn: ({ pageParam }) =>
      videosApi.list({ page: pageParam, limit: 12, query: search, sortBy, sortType }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.data.data.pagination
      return pagination.page < pagination.totalPages
        ? pagination.page + 1
        : undefined
    },
    enabled: Boolean(search),
  })
  const videos = query.data?.pages.flatMap((page) => page.data.data.videos) ?? []

  return (
    <section className="mx-auto max-w-7xl">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Search results</h1>
      <p className="mb-8 text-sm text-zinc-600 dark:text-zinc-400">
        {search ? `Results for “${search}”` : 'Enter a search term to find videos.'}
      </p>
      {search && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label htmlFor="video-sort" className="text-sm font-medium">Sort by</label>
          <select
            id="video-sort"
            value={`${sortBy}:${sortType}`}
            onChange={(event) => {
              const [nextSortBy, nextSortType] = event.target.value.split(':')
              setSearchParams((current) => {
                current.set('sortBy', nextSortBy)
                current.set('sortType', nextSortType)
                return current
              })
            }}
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="createdAt:desc">Newest</option>
            <option value="createdAt:asc">Oldest</option>
            <option value="views:desc">Most viewed</option>
            <option value="title:asc">Title A–Z</option>
          </select>
        </div>
      )}
      {!search && <EmptyState>Use the search bar above to find videos.</EmptyState>}
      {search && query.isPending && <LoadingState>Searching videos…</LoadingState>}
      {search && query.isError && (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      )}
      {search && !query.isPending && !query.isError && videos.length === 0 && (
        <EmptyState>No videos matched that search.</EmptyState>
      )}
      {videos.length > 0 && (
        <>
          <VideoGrid videos={videos} />
          {query.hasNextPage && (
            <div className="mt-9 text-center">
              <button
                type="button"
                onClick={() => query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
                className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default Search

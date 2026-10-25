import { Link } from 'react-router-dom'

const compactNumber = (value = 0) =>
  new Intl.NumberFormat(undefined, { notation: 'compact' }).format(value)

function VideoCard({ video }) {
  return (
    <article className="min-w-0">
      <Link
        to={`/watch/${video._id}`}
        className="group block overflow-hidden rounded-2xl bg-zinc-200 focus-visible:outline-rose-600 dark:bg-zinc-800"
        aria-label={`Watch ${video.title}`}
      >
        <div className="aspect-video">
          <img
            src={video.thumbnail}
            alt=""
            loading="lazy"
            className="size-full object-cover transition duration-200 group-hover:scale-[1.03]"
          />
        </div>
      </Link>
      <div className="mt-3 flex gap-3">
        {video.owner?.avatar ? (
          <Link to={`/channel/${video.owner.username}`} aria-label={`${video.owner.fullName || video.owner.username} channel`}>
            <img
              src={video.owner.avatar}
              alt=""
              loading="lazy"
              className="size-10 shrink-0 rounded-full object-cover"
            />
          </Link>
        ) : (
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {video.owner?.username?.[0]?.toUpperCase() || '?'}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="line-clamp-2 font-semibold leading-5 text-zinc-900 dark:text-white">
            <Link to={`/watch/${video._id}`} className="hover:text-rose-600">
              {video.title}
            </Link>
          </h2>
          {video.owner && (
            <Link
              to={`/channel/${video.owner.username}`}
              className="mt-1 block truncate text-sm text-zinc-600 hover:text-rose-600 dark:text-zinc-400"
            >
              {video.owner.fullName || video.owner.username}
            </Link>
          )}
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {compactNumber(video.views)} views
          </p>
        </div>
      </div>
    </article>
  )
}

export function VideoGrid({ videos }) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard key={video._id} video={video} />
      ))}
    </div>
  )
}

export function LoadingState({ children = 'Loading…' }) {
  return (
    <p role="status" className="py-16 text-center text-sm text-zinc-600 dark:text-zinc-400">
      {children}
    </p>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950/40">
      <p role="alert" className="text-sm text-rose-800 dark:text-rose-200">
        {error?.response?.data?.message || 'Something went wrong. Please try again.'}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ children = 'Nothing here yet.' }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
      {children}
    </div>
  )
}

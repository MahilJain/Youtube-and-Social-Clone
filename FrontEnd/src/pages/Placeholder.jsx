import { Link, useLocation } from 'react-router-dom'

function Placeholder({ title }) {
  const location = useLocation()
  const query = new URLSearchParams(location.search).get('q')

  return (
    <section className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <span
        aria-hidden="true"
        className="grid size-16 place-items-center rounded-2xl bg-rose-100 text-2xl text-rose-700 dark:bg-rose-950 dark:text-rose-300"
      >
        ▶
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">{title}</h1>
      {query && (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Search for “{query}”
        </p>
      )}
      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
        This part of Streamline is coming soon. We’re keeping the first version
        simple and will add more features as the app grows.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Back to home
      </Link>
    </section>
  )
}

export default Placeholder

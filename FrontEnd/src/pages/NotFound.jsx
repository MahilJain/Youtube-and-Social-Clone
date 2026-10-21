import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section className="grid min-h-[55vh] place-items-center text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-rose-600">
          404
        </p>
        <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          That page isn’t available.
        </p>
        <Link to="/" className="mt-5 inline-block text-sm font-semibold text-rose-600 hover:underline">
          Go to home
        </Link>
      </div>
    </section>
  )
}

export default NotFound

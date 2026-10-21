import { Link } from 'react-router-dom'

function Home() {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-rose-600 to-orange-500 px-6 py-12 text-white shadow-sm sm:px-10 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-100">
          Welcome to Streamline
        </p>
        <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
          A fresh home for the videos you love.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-rose-50 sm:text-base">
          Browse the video community, share something of your own, and make this
          space yours.
        </p>
        <Link
          to="/upload"
          className="mt-7 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-white"
        >
          Upload a video
        </Link>
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Explore videos</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Your feed will appear here.
          </p>
        </div>
      </div>
      <div className="mt-5 grid min-h-52 place-items-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
        <p className="max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          There are no videos to show yet. Once the feed is connected, you’ll
          find new videos here.
        </p>
      </div>
    </section>
  )
}

export default Home

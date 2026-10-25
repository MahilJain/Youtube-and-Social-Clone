import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../../api/auth.js'
import { useCurrentUser } from '../../app/useCurrentUser.js'
import { clearCredentials, toggleSidebar, toggleTheme } from '../../app/store.js'

function Navbar() {
  const [search, setSearch] = useState('')
  const [logoutError, setLogoutError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  const theme = useSelector((state) => state.preferences.theme)
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      dispatch(clearCredentials())
      queryClient.clear()
      setLogoutError('')
      navigate('/')
    },
    onError: (error) => {
      setLogoutError(error.response?.data?.message || 'Could not sign out. Try again.')
    },
  })

  useEffect(() => {
    setSearch(new URLSearchParams(location.search).get('q') || '')
  }, [location.search])

  const handleSearch = (event) => {
    event.preventDefault()
    const query = search.trim()
    if (query) navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          aria-label="Toggle sidebar"
          onClick={() => dispatch(toggleSidebar())}
          className="hidden size-10 shrink-0 place-items-center rounded-full text-xl text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 md:grid"
        >
          ☰
        </button>
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Streamline home">
          <span className="grid size-9 place-items-center rounded-xl bg-rose-600 text-sm text-white">
            ▶
          </span>
          <span className="hidden text-lg font-bold tracking-tight text-zinc-900 dark:text-white sm:block">
            streamline
          </span>
        </Link>

        <form onSubmit={handleSearch} role="search" className="mx-auto flex w-full max-w-xl">
          <label htmlFor="site-search" className="sr-only">
            Search videos
          </label>
          <input
            id="site-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search videos"
            className="min-w-0 flex-1 rounded-l-full border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          <button
            type="submit"
            aria-label="Submit search"
            className="rounded-r-full border border-l-0 border-zinc-300 bg-zinc-100 px-5 text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            Search
          </button>
        </form>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to={user ? '/upload' : '/login'}
            className="hidden items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 sm:flex"
          >
            <span aria-hidden="true">＋</span>
            Upload
          </Link>
          <button
            type="button"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            onClick={() => dispatch(toggleTheme())}
            className="grid size-10 place-items-center rounded-full text-lg text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              <Link to={`/channel/${user.username}`} className="flex items-center gap-2 rounded-full p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label={`Open ${user.fullName}'s channel`}>
                <img src={user.avatar} alt="" className="size-8 rounded-full object-cover" />
                <span className="hidden max-w-28 truncate text-sm font-medium sm:block">{user.fullName}</span>
              </Link>
              <button
                type="button"
                disabled={logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
                className="rounded-full border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
              >
                {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
      {logoutError && (
        <p role="alert" className="mx-auto max-w-[1600px] px-4 pb-2 text-right text-xs text-rose-700 dark:text-rose-300">
          {logoutError}
        </p>
      )}
    </header>
  )
}

export default Navbar

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { authApi } from '../api/auth.js'
import { setCredentials } from '../app/store.js'
import { ErrorState } from '../components/VideoGrid.jsx'

function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [error, setError] = useState(null)
  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => {
      const { user, accessToken } = data.data
      dispatch(setCredentials({ user, accessToken }))
      queryClient.setQueryData(['auth', 'currentUser'], user)
      navigate(location.state?.from || '/', { replace: true })
    },
    onError: setError,
  })

  return (
    <section className="mx-auto max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-400">
        Welcome back
      </p>
      <h1 className="mt-2 text-2xl font-bold">Sign in to Streamline</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Use your username or email address.
      </p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          setError(null)
          const form = new FormData(event.currentTarget)
          mutation.mutate({
            email: form.get('identity'),
            password: form.get('password'),
          })
        }}
      >
        <label className="block text-sm font-medium">
          Username or email
          <input
            name="identity"
            required
            autoComplete="username"
            className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 dark:border-zinc-700"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 dark:border-zinc-700"
          />
        </label>
        {error && <ErrorState error={error} />}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-full bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-zinc-600 dark:text-zinc-400">
        New here? <Link to="/register" className="font-semibold text-rose-600">Create an account</Link>
      </p>
    </section>
  )
}

function Register() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => navigate('/login', { replace: true }),
    onError: setError,
  })

  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-400">
        Join the community
      </p>
      <h1 className="mt-2 text-2xl font-bold">Create your account</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Add a profile photo and you’ll be ready to explore and publish.
      </p>
      <form
        className="mt-6 grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault()
          setError(null)
          mutation.mutate(new FormData(event.currentTarget))
        }}
      >
        <label className="text-sm font-medium">
          Full name
          <input name="fullName" required autoComplete="name" className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 dark:border-zinc-700" />
        </label>
        <label className="text-sm font-medium">
          Username
          <input name="username" required autoComplete="username" minLength="3" className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 dark:border-zinc-700" />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Email
          <input name="email" type="email" required autoComplete="email" className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 dark:border-zinc-700" />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Password (at least 6 characters)
          <input name="password" type="password" required minLength="6" autoComplete="new-password" className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 dark:border-zinc-700" />
        </label>
        <label className="text-sm font-medium">
          Avatar (required)
          <input name="avatar" type="file" accept="image/*" required className="mt-1.5 block w-full text-sm" />
        </label>
        <label className="text-sm font-medium">
          Cover image (optional)
          <input name="coverImage" type="file" accept="image/*" className="mt-1.5 block w-full text-sm" />
        </label>
        <div className="sm:col-span-2">
          {error && <ErrorState error={error} />}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-3 w-full rounded-full bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {mutation.isPending ? 'Creating account…' : 'Create account'}
          </button>
        </div>
      </form>
      <p className="mt-5 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account? <Link to="/login" className="font-semibold text-rose-600">Sign in</Link>
      </p>
    </section>
  )
}

export { Login, Register }

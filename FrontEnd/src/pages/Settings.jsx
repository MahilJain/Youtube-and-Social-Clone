import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth.js'
import { useCurrentUser } from '../app/useCurrentUser.js'
import { clearCredentials, setCredentials } from '../app/store.js'
import { ErrorState, LoadingState } from '../components/VideoGrid.jsx'

function Settings() {
  const { user, isLoading } = useCurrentUser()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [accountError, setAccountError] = useState(null)
  const [imageError, setImageError] = useState(null)
  const [passwordError, setPasswordError] = useState(null)
  const updateAccount = useMutation({
    mutationFn: authApi.updateAccount,
    onSuccess: ({ data }) => {
      dispatch(setCredentials({ user: data.data }))
      queryClient.setQueryData(['auth', 'currentUser'], data.data)
      setAccountError(null)
    },
    onError: setAccountError,
  })
  const updateAvatar = useMutation({
    mutationFn: authApi.updateAvatar,
    onSuccess: ({ data }) => {
      dispatch(setCredentials({ user: data.data }))
      queryClient.setQueryData(['auth', 'currentUser'], data.data)
      setImageError(null)
    },
    onError: setImageError,
  })
  const updateCover = useMutation({
    mutationFn: authApi.updateCoverImage,
    onSuccess: ({ data }) => {
      dispatch(setCredentials({ user: data.data }))
      queryClient.setQueryData(['auth', 'currentUser'], data.data)
      setImageError(null)
    },
    onError: setImageError,
  })
  const changePassword = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      dispatch(clearCredentials())
      queryClient.removeQueries({ queryKey: ['auth', 'currentUser'] })
      navigate('/login', { replace: true })
    },
    onError: setPasswordError,
  })

  if (isLoading) return <LoadingState>Checking your session…</LoadingState>
  if (!user) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="text-2xl font-bold">Account settings</h1>
        <Link to="/login" className="mt-5 inline-flex rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white">Sign in</Link>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Account settings</h1>
      <div className="mt-7 space-y-6">
        <form key={user.updatedAt} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900" onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          updateAccount.mutate({ fullName: form.get('fullName'), email: form.get('email') })
        }}>
          <h2 className="font-bold">Profile details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">Full name<input name="fullName" defaultValue={user.fullName} required className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 dark:border-zinc-700" /></label>
            <label className="text-sm font-medium">Email<input name="email" type="email" defaultValue={user.email} required className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 dark:border-zinc-700" /></label>
          </div>
          {accountError && <div className="mt-4"><ErrorState error={accountError} /></div>}
          {updateAccount.isSuccess && <p role="status" className="mt-3 text-sm text-emerald-700">Profile updated.</p>}
          <button disabled={updateAccount.isPending} className="mt-4 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900">
            {updateAccount.isPending ? 'Saving…' : 'Save profile'}
          </button>
        </form>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-bold">Profile images</h2>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <img src={user.avatar} alt="" className="size-14 rounded-full object-cover" />
            <form className="flex flex-wrap items-center gap-3" onSubmit={(event) => {
              event.preventDefault()
              updateAvatar.mutate(new FormData(event.currentTarget))
            }}>
              <input name="avatar" type="file" accept="image/*" required aria-label="Choose new avatar" className="max-w-full text-sm" />
              <button disabled={updateAvatar.isPending} className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold dark:border-zinc-700">{updateAvatar.isPending ? 'Uploading…' : 'Update avatar'}</button>
            </form>
          </div>
          <form className="mt-5 flex flex-wrap items-center gap-3" onSubmit={(event) => {
            event.preventDefault()
            updateCover.mutate(new FormData(event.currentTarget))
          }}>
            <input name="coverImage" type="file" accept="image/*" required aria-label="Choose new cover image" className="max-w-full text-sm" />
            <button disabled={updateCover.isPending} className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold dark:border-zinc-700">{updateCover.isPending ? 'Uploading…' : 'Update cover'}</button>
          </form>
          {imageError && <div className="mt-4"><ErrorState error={imageError} /></div>}
        </div>

        <form className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900" onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          changePassword.mutate({ oldPassword: form.get('oldPassword'), newPassword: form.get('newPassword') })
        }}>
          <h2 className="font-bold">Change password</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">Current password<input name="oldPassword" type="password" required autoComplete="current-password" className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 dark:border-zinc-700" /></label>
            <label className="text-sm font-medium">New password (6+ characters)<input name="newPassword" type="password" required minLength="6" autoComplete="new-password" className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 dark:border-zinc-700" /></label>
          </div>
          {passwordError && <div className="mt-4"><ErrorState error={passwordError} /></div>}
          <button disabled={changePassword.isPending} className="mt-4 rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold dark:border-zinc-700">
            {changePassword.isPending ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default Settings

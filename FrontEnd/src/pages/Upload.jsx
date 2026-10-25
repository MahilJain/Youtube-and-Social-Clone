import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { videosApi } from '../api/videos.js'
import { useCurrentUser } from '../app/useCurrentUser.js'
import { ErrorState, LoadingState } from '../components/VideoGrid.jsx'

function Upload() {
  const { user, isLoading } = useCurrentUser()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationError, setValidationError] = useState('')
  const mutation = useMutation({
    mutationFn: (formData) => videosApi.publish(formData, {
      onUploadProgress: ({ loaded, total }) => {
        if (total) setUploadProgress(Math.round((loaded / total) * 100))
      },
    }),
    onSuccess: ({ data }) => {
      setUploadProgress(100)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['videos'] })
      navigate(`/watch/${data.data._id}`)
    },
  })

  if (isLoading) return <LoadingState>Checking your session…</LoadingState>
  if (!user) {
    return (
      <section className="mx-auto max-w-xl rounded-3xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
        <h1 className="text-xl font-bold">Sign in to publish</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Create an account or sign in before uploading a video.</p>
        <Link to="/login" className="mt-5 inline-flex rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white">Sign in</Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-400">Creator studio</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Upload a video</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Add your video details and a thumbnail. Duration is in seconds.
      </p>
      <form
        className="mt-7 space-y-5 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-7"
        onSubmit={(event) => {
          event.preventDefault()
          const formData = new FormData(event.currentTarget)
          const fileLimit = 500 * 1024 * 1024
          const videoFile = formData.get('videoFile')
          const thumbnail = formData.get('thumbnail')
          if (videoFile.size > fileLimit || thumbnail.size > fileLimit) {
            setValidationError('Each file must be 500 MiB or smaller.')
            return
          }
          setValidationError('')
          setUploadProgress(0)
          mutation.reset()
          mutation.mutate(formData)
        }}
      >
        <label className="block text-sm font-medium">
          Video title
          <input name="title" required maxLength="200" className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 dark:border-zinc-700" />
        </label>
        <label className="block text-sm font-medium">
          Description
          <textarea name="description" required rows="5" className="mt-1.5 w-full resize-y rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 dark:border-zinc-700" />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Video file
            <input name="videoFile" type="file" accept="video/*" required className="mt-1.5 block w-full text-sm" />
            <span className="mt-1 block text-xs font-normal text-zinc-500">The server currently allows up to 500 MiB per file.</span>
          </label>
          <label className="block text-sm font-medium">
            Thumbnail
            <input name="thumbnail" type="file" accept="image/*" required className="mt-1.5 block w-full text-sm" />
          </label>
        </div>
        <label className="block max-w-xs text-sm font-medium">
          Duration (seconds)
          <input name="duration" type="number" min="0" step="any" required className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 dark:border-zinc-700" />
        </label>
        {validationError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{validationError}</p>}
        {mutation.isError && <ErrorState error={mutation.error} />}
        {mutation.isPending && (
          <div aria-live="polite">
            <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
              <span>Sending files to the server</span>
              <span>{uploadProgress}%</span>
            </div>
            <progress value={uploadProgress} max="100" className="mt-2 h-2 w-full accent-rose-600" aria-label="Upload progress" />
            <p className="mt-1 text-xs text-zinc-500">The server may continue processing the upload after transfer completes.</p>
          </div>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
        >
          {mutation.isPending ? 'Uploading… this may take a while' : 'Publish video'}
        </button>
      </form>
    </section>
  )
}

export default Upload

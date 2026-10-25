import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router.jsx'

function App() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center text-sm text-muted">
          Loading page…
        </div>
      }
    >
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </Suspense>
  )
}

export default App 

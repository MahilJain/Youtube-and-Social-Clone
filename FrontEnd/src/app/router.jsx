import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/layout/Layout.jsx'

const Home = lazy(() => import('../pages/Home.jsx'))
const Placeholder = lazy(() => import('../pages/Placeholder.jsx'))
const NotFound = lazy(() => import('../pages/NotFound.jsx'))

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'subscriptions', element: <Placeholder title="Subscriptions" /> },
        { path: 'history', element: <Placeholder title="Watch history" /> },
        { path: 'liked', element: <Placeholder title="Liked videos" /> },
        { path: 'upload', element: <Placeholder title="Upload" /> },
        { path: 'studio', element: <Placeholder title="Studio" /> },
        { path: 'watch', element: <Placeholder title="Watch" /> },
        { path: 'channel/:username', element: <Placeholder title="Channel" /> },
        { path: 'search', element: <Placeholder title="Search results" /> },
        { path: 'login', element: <Placeholder title="Sign in" /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
)

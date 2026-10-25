import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/layout/Layout.jsx'

const Home = lazy(() => import('../pages/Home.jsx'))
const Watch = lazy(() => import('../pages/Watch.jsx'))
const Search = lazy(() => import('../pages/Search.jsx'))
const Channel = lazy(() => import('../pages/Channel.jsx'))
const Upload = lazy(() => import('../pages/Upload.jsx'))
const Studio = lazy(() => import('../pages/Studio.jsx'))
const Playlists = lazy(() => import('../pages/Playlists.jsx'))
const Settings = lazy(() => import('../pages/Settings.jsx'))
const Login = lazy(() =>
  import('../pages/Auth.jsx').then((module) => ({ default: module.Login })),
)
const Register = lazy(() =>
  import('../pages/Auth.jsx').then((module) => ({ default: module.Register })),
)
const History = lazy(() =>
  import('../pages/Library.jsx').then((module) => ({ default: module.History })),
)
const Liked = lazy(() =>
  import('../pages/Library.jsx').then((module) => ({ default: module.Liked })),
)
const Subscriptions = lazy(() =>
  import('../pages/Library.jsx').then((module) => ({
    default: module.Subscriptions,
  })),
)
const NotFound = lazy(() => import('../pages/NotFound.jsx'))

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'subscriptions', element: <Subscriptions /> },
        { path: 'history', element: <History /> },
        { path: 'liked', element: <Liked /> },
        { path: 'playlists', element: <Playlists /> },
        { path: 'upload', element: <Upload /> },
        { path: 'studio', element: <Studio /> },
        { path: 'settings', element: <Settings /> },
        { path: 'watch/:videoId', element: <Watch /> },
        { path: 'channel/:username', element: <Channel /> },
        { path: 'search', element: <Search /> },
        { path: 'login', element: <Login /> },
        { path: 'register', element: <Register /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
)

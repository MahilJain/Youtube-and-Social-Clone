import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Navbar from './Navbar.jsx'
import Sidebar from './Sidebar.jsx'
import MobileNavigation from './MobileNavigation.jsx'

function Layout() {
  const theme = useSelector((state) => state.preferences.theme)
  const sidebarExpanded = useSelector(
    (state) => state.preferences.sidebarExpanded,
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('streamline-theme', JSON.stringify(theme))
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(
      'streamline-sidebar-expanded',
      JSON.stringify(sidebarExpanded),
    )
  }, [sidebarExpanded])

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1600px]">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 md:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileNavigation />
    </div>
  )
}

export default Layout

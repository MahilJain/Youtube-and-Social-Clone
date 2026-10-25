import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home', icon: '⌂', end: true },
  { to: '/subscriptions', label: 'Following', icon: '▤' },
  { to: '/history', label: 'History', icon: '◷' },
  { to: '/liked', label: 'Liked', icon: '♡' },
  { to: '/playlists', label: 'Playlists', icon: '▣' },
]

function MobileNavigation() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-zinc-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden"
    >
      {links.map(({ to, label, icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] ${
              isActive
                ? 'font-semibold text-rose-600 dark:text-rose-400'
                : 'text-zinc-500 dark:text-zinc-400'
            }`
          }
        >
          <span aria-hidden="true" className="text-xl leading-none">
            {icon}
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default MobileNavigation

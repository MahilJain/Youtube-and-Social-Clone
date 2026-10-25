import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'

const links = [
  { to: '/', label: 'Home', icon: '⌂', end: true },
  { to: '/subscriptions', label: 'Subscriptions', icon: '▤' },
  { to: '/history', label: 'History', icon: '◷' },
  { to: '/liked', label: 'Liked videos', icon: '♡' },
  { to: '/playlists', label: 'Playlists', icon: '▣' },
  { to: '/studio', label: 'Studio', icon: '▣' },
]

function Sidebar() {
  const expanded = useSelector((state) => state.preferences.sidebarExpanded)

  return (
    <aside
      aria-label="Main navigation"
      className={`hidden shrink-0 border-r border-zinc-200 bg-white px-3 py-5 transition-[width] dark:border-zinc-800 dark:bg-zinc-950 md:block ${
        expanded ? 'w-60' : 'w-[76px]'
      }`}
    >
      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={expanded ? undefined : label}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-4 rounded-xl px-3 text-sm transition-colors ${
                isActive
                  ? 'bg-zinc-100 font-semibold text-zinc-950 dark:bg-zinc-800 dark:text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'
              } ${expanded ? '' : 'justify-center'}`
            }
          >
            <span aria-hidden="true" className="w-6 text-center text-xl leading-none">
              {icon}
            </span>
            {expanded && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
      {expanded && (
        <p className="mt-8 px-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Your video space, made simple.
        </p>
      )}
    </aside>
  )
}

export default Sidebar

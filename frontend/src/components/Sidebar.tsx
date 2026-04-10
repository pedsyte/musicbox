import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import Tooltip from './Tooltip'

const navItems = [
  { path: '/', label: 'Главная', icon: '🏠' },
  { path: '/browse', label: 'Обзор', icon: '🎵' },
  { path: '/explore', label: 'Жанры', icon: '🎭' },
  { path: '/playlists', label: 'Плейлисты', icon: '📋' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const { user } = useAuthStore()

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-[var(--surface)] border-r border-[var(--border)] h-full">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 px-5 py-5">
        <span className="text-2xl">🎧</span>
        <span className="text-lg font-bold text-[var(--text)]">MusicBox</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(item => {
          const active = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
          return (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${active ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium' : 'text-[var(--text-dim)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}

        {user && (
          <Link to="/favorites"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${pathname === '/favorites' ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium' : 'text-[var(--text-dim)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'}`}
          >
            <span>❤️</span>
            <span>Избранное</span>
          </Link>
        )}

        {user?.is_admin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-wider">Админ</p>
            </div>
            <Link to="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${pathname.startsWith('/admin') ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium' : 'text-[var(--text-dim)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'}`}
            >
              <span>⚙️</span>
              <span>Управление</span>
            </Link>
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-[var(--border)]">
        {user ? (
          <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--surface-hover)] transition">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-bold">
              {user.username[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[var(--text)] truncate">{user.username}</p>
              <p className="text-[10px] text-[var(--text-dim)]">{user.is_admin ? 'Администратор' : 'Пользователь'}</p>
            </div>
          </Link>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="flex-1 text-center text-sm py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition">Войти</Link>
            <Link to="/register" className="flex-1 text-center text-sm py-2 rounded-lg border border-[var(--border)] text-[var(--text-dim)] hover:bg-[var(--surface-hover)] transition">Создать</Link>
          </div>
        )}
      </div>
    </aside>
  )
}

import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from 'react-i18next'
import Tooltip from './Tooltip'

const navItems = [
  { path: '/', labelKey: 'nav.home', icon: '🏠' },
  { path: '/browse', labelKey: 'nav.browse', icon: '🎵' },
  { path: '/explore', labelKey: 'nav.genres', icon: '🎭' },
  { path: '/playlists', labelKey: 'nav.playlists', icon: '📋' },
  { path: '/extension', labelKey: 'nav.extension', icon: '🧩' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const { user } = useAuthStore()
  const { t } = useTranslation()

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-[var(--surface)] border-r border-[var(--border)] h-full">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 px-5 py-5 hover:opacity-80 transition">
        <img src="/logo.png" alt="MusicBox" className="w-10 h-10" />
        <div>
          <span className="text-lg font-bold text-[var(--text)] block leading-tight">MusicBox</span>
          <span className="text-[10px] text-[var(--text-dim)] leading-tight">{t('home.hero')}</span>
        </div>
      </Link>

      <div className="mx-4 mb-2 border-b border-[var(--border)]" />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(item => {
          const active = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
          return (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${active ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium' : 'text-[var(--text-dim)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'}`}
            >
              <span>{item.icon}</span>
              <span>{t(item.labelKey)}</span>
            </Link>
          )
        })}

        {user && (
          <Link to="/favorites"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${pathname === '/favorites' ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium' : 'text-[var(--text-dim)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'}`}
          >
            <span>❤️</span>
            <span>{t('nav.favorites')}</span>
          </Link>
        )}

        {user?.is_admin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-wider">{t('nav.admin')}</p>
            </div>
            <Link to="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${pathname.startsWith('/admin') ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium' : 'text-[var(--text-dim)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'}`}
            >
              <span>⚙️</span>
              <span>{t('nav.manage')}</span>
            </Link>
          </>
        )}
      </nav>

      {/* Footer link */}
      <div className="px-6 py-2">
        <Link to="/privacy" className="text-[10px] text-[var(--text-dim)] hover:text-[var(--accent)] transition">{t('nav.privacy')}</Link>
      </div>

      {/* User */}
      <div className="p-3 border-t border-[var(--border)]">
        {user ? (
          <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--surface-hover)] transition">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-bold">
                {user.username[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[var(--text)] truncate">{user.username}</p>
              <p className="text-[10px] text-[var(--text-dim)]">{user.is_admin ? t('settings.administrator') : t('settings.user')}</p>
            </div>
          </Link>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="flex-1 text-center text-sm py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition">{t('nav.login')}</Link>
            <Link to="/register" className="flex-1 text-center text-sm py-2 rounded-lg border border-[var(--border)] text-[var(--text-dim)] hover:bg-[var(--surface-hover)] transition">{t('nav.register')}</Link>
          </div>
        )}
      </div>
    </aside>
  )
}

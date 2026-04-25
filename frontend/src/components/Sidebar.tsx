import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from 'react-i18next'
import { Disc3, Heart, Home, Library, LogIn, Music2, Puzzle, Settings, Shield, UserPlus } from 'lucide-react'

const navItems = [
  { path: '/', labelKey: 'nav.home', Icon: Home },
  { path: '/browse', labelKey: 'nav.browse', Icon: Music2 },
  { path: '/explore', labelKey: 'nav.genres', Icon: Disc3 },
  { path: '/playlists', labelKey: 'nav.playlists', Icon: Library },
  { path: '/extension', labelKey: 'nav.extension', Icon: Puzzle },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const { user } = useAuthStore()
  const { t } = useTranslation()

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-[var(--border)] h-full bg-[color-mix(in_srgb,var(--surface)_82%,transparent)] backdrop-blur-2xl">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 px-5 py-5 hover:opacity-90 transition">
        <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)]">
          <img src="/logo.png" alt="MusicBox" className="h-8 w-8 object-contain" />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[var(--accent-2)] shadow-[0_0_18px_var(--accent-2)]" />
        </span>
        <div className="min-w-0">
          <span className="block text-lg font-black leading-tight tracking-normal text-[var(--text)]">MusicBox</span>
          <span className="studio-kicker block truncate text-[0.62rem]">{t('brand.tagline', { defaultValue: 'AI music studio' })}</span>
        </div>
      </Link>

      <div className="mx-5 mb-3 border-b border-[var(--border)]" />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1.5">
        {navItems.map(item => {
          const active = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
          const Icon = item.Icon
          return (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition ${active ? 'bg-[var(--accent)]/14 text-[var(--text)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_38%,transparent)]' : 'text-[var(--text-dim)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'}`}
            >
              <Icon size={18} className={active ? 'text-[var(--accent)]' : ''} />
              <span>{t(item.labelKey)}</span>
            </Link>
          )
        })}

        {user && (
          <Link to="/favorites"
            className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition ${pathname === '/favorites' ? 'bg-[var(--accent)]/14 text-[var(--text)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_38%,transparent)]' : 'text-[var(--text-dim)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'}`}
          >
            <Heart size={18} className={pathname === '/favorites' ? 'text-[var(--accent-3)]' : ''} />
            <span>{t('nav.favorites')}</span>
          </Link>
        )}

        {user?.is_admin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-wider">{t('nav.admin')}</p>
            </div>
            <Link to="/admin"
              className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition ${pathname.startsWith('/admin') ? 'bg-[var(--accent)]/14 text-[var(--text)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_38%,transparent)]' : 'text-[var(--text-dim)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'}`}
            >
              <Shield size={18} />
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
          <Link to="/settings" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-[var(--surface-hover)] transition">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-3))] flex items-center justify-center text-white text-sm font-bold">
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
            <Link to="/login" className="studio-primary-button min-h-0 flex-1 py-2 text-xs"><LogIn size={14} />{t('nav.login')}</Link>
            <Link to="/register" className="studio-secondary-button min-h-0 flex-1 py-2 text-xs"><UserPlus size={14} />{t('nav.register')}</Link>
          </div>
        )}
      </div>
    </aside>
  )
}

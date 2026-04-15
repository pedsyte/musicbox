import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from 'react-i18next'

export default function MobileNav() {
  const { pathname } = useLocation()
  const { user } = useAuthStore()
  const { t } = useTranslation()

  const mobileNavItems = [
    { path: '/', label: t('nav.home'), icon: '🏠' },
    { path: '/browse', label: t('nav.browse'), icon: '🎵' },
    { path: '/explore', label: t('nav.genres'), icon: '🎭' },
    ...(user ? [{ path: '/favorites', label: t('nav.favorites'), icon: '❤️' }] : []),
    user ? { path: '/settings', label: t('nav.more'), icon: '☰' } : { path: '/login', label: t('nav.login'), icon: '👤' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)] border-t border-[var(--border)] px-1 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around">
        {mobileNavItems.map(item => {
          const active = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
          return (
            <Link key={item.path} to={item.path}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 text-xs transition ${active ? 'text-[var(--accent)]' : 'text-[var(--text-dim)]'}`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

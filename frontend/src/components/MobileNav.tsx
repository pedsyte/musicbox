import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from 'react-i18next'
import { Disc3, Heart, Home, Menu, Music2, User } from 'lucide-react'

export default function MobileNav() {
  const { pathname } = useLocation()
  const { user } = useAuthStore()
  const { t } = useTranslation()

  const mobileNavItems = [
    { path: '/', label: t('nav.home'), Icon: Home },
    { path: '/browse', label: t('nav.browse'), Icon: Music2 },
    { path: '/explore', label: t('nav.genres'), Icon: Disc3 },
    ...(user ? [{ path: '/favorites', label: t('nav.favorites'), Icon: Heart }] : []),
    user ? { path: '/settings', label: t('nav.more'), Icon: Menu } : { path: '/login', label: t('nav.login'), Icon: User },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--player-bg)] px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl">
      <div className="flex items-center justify-around">
        {mobileNavItems.map(item => {
          const active = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
          const Icon = item.Icon
          return (
            <Link key={item.path} to={item.path}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-2 px-1 text-[0.68rem] font-semibold transition ${active ? 'text-[var(--accent)]' : 'text-[var(--text-dim)]'}`}
            >
              <span className={`flex h-7 w-9 items-center justify-center rounded-full ${active ? 'bg-[var(--accent)]/14' : ''}`}>
                <Icon size={18} />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

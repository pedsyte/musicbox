import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useTranslation } from 'react-i18next'
import Tooltip from './Tooltip'
import { useState, useRef, useEffect } from 'react'

export default function Header() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const [searchVal, setSearchVal] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchVal.trim())}`)
      setShowSearch(false)
    }
  }

  useEffect(() => {
    if (showSearch) inputRef.current?.focus()
  }, [showSearch])

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)] px-4 md:px-6 h-14 flex items-center gap-4">
      {/* Mobile logo */}
      <img src="/logo.png" alt="MusicBox" className="md:hidden w-9 h-9" />

      {/* Navigation arrows (desktop) */}
      <div className="hidden md:flex items-center gap-1">
        <Tooltip text={t('nav.back')}>
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text)] opacity-60 hover:opacity-100 transition text-base">←</button>
        </Tooltip>
        <Tooltip text={t('nav.forward')}>
          <button onClick={() => navigate(1)} className="w-8 h-8 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text)] opacity-60 hover:opacity-100 transition text-base">→</button>
        </Tooltip>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] text-base">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-full pl-9 pr-4 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] transition"
          />
        </div>
      </form>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {!user ? (
          <>
            <Tooltip text={t('nav.loginToAccount')}>
              <button onClick={() => navigate('/login')} className="hidden md:block text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition">{t('nav.login')}</button>
            </Tooltip>
          </>
        ) : (
<Tooltip text={t('nav.settings')}>
            <button onClick={() => navigate('/settings')} className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-bold hover:scale-110 hover:brightness-110 transition overflow-hidden">
              {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user.username[0].toUpperCase()}
            </button>
          </Tooltip>
        )}
      </div>
    </header>
  )
}

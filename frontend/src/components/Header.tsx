import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from 'react-i18next'
import Tooltip from './Tooltip'
import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, LogIn, Search, Settings } from 'lucide-react'

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
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_76%,transparent)] px-4 md:px-6 h-16 flex items-center gap-4 backdrop-blur-2xl">
      {/* Mobile logo */}
      <img src="/logo.png" alt="MusicBox" className="md:hidden h-9 w-9 object-contain" />

      {/* Navigation arrows (desktop) */}
      <div className="hidden md:flex items-center gap-1">
        <Tooltip text={t('nav.back')}>
          <button onClick={() => navigate(-1)} className="studio-icon-button h-9 w-9"><ChevronLeft size={18} /></button>
        </Tooltip>
        <Tooltip text={t('nav.forward')}>
          <button onClick={() => navigate(1)} className="studio-icon-button h-9 w-9"><ChevronRight size={18} /></button>
        </Tooltip>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            ref={inputRef}
            type="text"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder={t('search.placeholder')}
            className="studio-input w-full pl-10 pr-4 py-2.5 text-sm placeholder:text-[var(--text-dim)] focus:outline-none"
          />
        </div>
      </form>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {!user ? (
          <>
            <Tooltip text={t('nav.loginToAccount')}>
              <button onClick={() => navigate('/login')} className="studio-secondary-button hidden min-h-0 px-4 py-2 text-sm md:inline-flex"><LogIn size={16} />{t('nav.login')}</button>
            </Tooltip>
          </>
        ) : (
<Tooltip text={t('nav.settings')}>
            <button onClick={() => navigate('/settings')} className="h-10 w-10 rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] flex items-center justify-center text-white text-sm font-bold hover:scale-105 transition overflow-hidden">
              {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <Settings size={17} className="text-[var(--accent)]" />}
            </button>
          </Tooltip>
        )}
      </div>
    </header>
  )
}

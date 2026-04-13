import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { languages } from '@/i18n'

export default function Settings() {
  const { user, logout, updateSettings, uploadAvatar, deleteAvatar } = useAuthStore()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [theme, setTheme] = useState(user?.theme || 'dark')
  const [showWaveform, setShowWaveform] = useState(user?.show_waveform ?? true)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [avatarLoading, setAvatarLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const handleTheme = async (v: string) => {
    setTheme(v)
    document.documentElement.setAttribute('data-theme', v)
    await updateSettings({ theme: v })
  }

  const handleWaveform = async (v: boolean) => {
    setShowWaveform(v)
    await updateSettings({ show_waveform: v })
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oldPassword || !newPassword) return
    try {
      await updateSettings({ old_password: oldPassword, new_password: newPassword })
      setMsg(t('settings.passwordChanged'))
      setOldPassword('')
      setNewPassword('')
    } catch {
      setMsg(t('settings.passwordError'))
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-[var(--text)]">{t('settings.title')}</h1>

      {/* Profile */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-2xl font-bold">
                {user.username[0].toUpperCase()}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-lg transition cursor-pointer"
            >📷</button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async e => {
              const f = e.target.files?.[0]
              if (!f) return
              setAvatarLoading(true)
              try { await uploadAvatar(f) } catch { setMsg(t('admin.error')) }
              setAvatarLoading(false)
              e.target.value = ''
            }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-[var(--text)]">{user.username}</p>
            <p className="text-xs text-[var(--text-dim)]">{user.is_admin ? t('settings.administrator') : t('settings.user')}</p>
          </div>
          {user.avatar && (
            <button onClick={async () => { setAvatarLoading(true); try { await deleteAvatar() } catch {} setAvatarLoading(false) }}
              className="text-xs text-red-400 hover:text-red-300 transition">{t('settings.removeAvatar')}</button>
          )}
        </div>
      </div>

      {/* Language */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text)]">{t('settings.language')}</h2>
        <div className="grid grid-cols-3 gap-2">
          {languages.map(lang => (
            <button key={lang.code} onClick={() => i18n.changeLanguage(lang.code)}
              className={`px-3 py-2.5 rounded-lg text-sm border transition flex items-center justify-center gap-2 ${i18n.language === lang.code ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-dim)] hover:bg-[var(--surface-hover)]'}`}>
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text)]">{t('settings.theme')}</h2>
        <div className="flex gap-2">
          {[{ v: 'dark', l: t('settings.dark') }, { v: 'light', l: t('settings.light') }].map(opt => (
            <button key={opt.v} onClick={() => handleTheme(opt.v)}
              className={`flex-1 px-4 py-3 rounded-lg text-sm border transition ${theme === opt.v ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-dim)] hover:bg-[var(--surface-hover)]'}`}>
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {/* Waveform */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">{t('settings.waveform')}</p>
            <p className="text-xs text-[var(--text-dim)]">{t('settings.waveformDesc')}</p>
          </div>
          <input type="checkbox" checked={showWaveform} onChange={e => handleWaveform(e.target.checked)}
            className="w-5 h-5 accent-[var(--accent)]" />
        </label>
      </div>

      {/* Password */}
      <form onSubmit={handlePassword} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text)]">{t('settings.changePassword')}</h2>
        {msg && <p className="text-xs text-[var(--accent)]">{msg}</p>}
        <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder={t('settings.oldPassword')}
          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]" />
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t('settings.newPassword')}
          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]" />
        <button type="submit" className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm hover:opacity-90 transition">{t('settings.changePasswordBtn')}</button>
      </form>

      {/* Logout */}
      <button onClick={handleLogout} className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm transition">
        {t('settings.logout')}
      </button>
    </div>
  )
}

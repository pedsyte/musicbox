import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Login() {
  const { login, error, loading } = useAuthStore()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await login(username, password)
    if (ok) navigate('/')
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="MusicBox" className="w-20 h-20 mx-auto" />
          <h1 className="text-xl font-bold text-[var(--text)] mt-2">{t('auth.loginTitle')}</h1>
        </div>

        {error && <p className="text-sm text-red-400 text-center bg-red-500/10 rounded-lg p-2">{error}</p>}

        <div>
          <label className="text-xs text-[var(--text-dim)] mb-1 block">{t('auth.username')}</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoFocus
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-dim)] mb-1 block">{t('auth.password')}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-[var(--accent)] text-white rounded-lg py-3 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition">
          {loading ? t('auth.loggingIn') : t('auth.loginBtn')}
        </button>

        <p className="text-center text-sm text-[var(--text-dim)]">
          {t('auth.noAccount')} <Link to="/register" className="text-[var(--accent)] hover:underline">{t('auth.createLink')}</Link>
        </p>
      </form>
    </div>
  )
}

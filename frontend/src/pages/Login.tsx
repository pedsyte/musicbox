import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogIn, Music2 } from 'lucide-react'

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
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <form onSubmit={handleSubmit} className="studio-panel w-full max-w-sm space-y-4 p-6">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--accent)]">
            <Music2 size={28} />
          </div>
          <h1 className="text-xl font-bold text-[var(--text)] mt-2">{t('auth.loginTitle')}</h1>
        </div>

        {error && <p className="text-sm text-red-400 text-center bg-red-500/10 rounded-lg p-2">{error}</p>}

        <div>
          <label className="text-xs text-[var(--text-dim)] mb-1 block">{t('auth.username')}</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoFocus
            className="studio-input" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-dim)] mb-1 block">{t('auth.password')}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            className="studio-input" />
        </div>

        <button type="submit" disabled={loading}
          className="studio-primary-button w-full justify-center disabled:opacity-50">
          <LogIn size={16} />
          {loading ? t('auth.loggingIn') : t('auth.loginBtn')}
        </button>

        <p className="text-center text-sm text-[var(--text-dim)]">
          {t('auth.noAccount')} <Link to="/register" className="text-[var(--accent)] hover:underline">{t('auth.createLink')}</Link>
        </p>
      </form>
    </div>
  )
}

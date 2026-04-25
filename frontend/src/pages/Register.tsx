import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Music2, UserPlus } from 'lucide-react'

export default function Register() {
  const { register, error, loading } = useAuthStore()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [localErr, setLocalErr] = useState('')
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== password2) { setLocalErr(t('auth.passwordMismatch')); return }
    if (password.length < 4) { setLocalErr(t('auth.passwordMin')); return }
    setLocalErr('')
    const ok = await register(username, password)
    if (ok) navigate('/')
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <form onSubmit={handleSubmit} className="studio-panel w-full max-w-sm space-y-4 p-6">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--accent)]">
            <Music2 size={28} />
          </div>
          <h1 className="text-xl font-bold text-[var(--text)] mt-2">{t('auth.registerTitle')}</h1>
        </div>

        {(error || localErr) && <p className="text-sm text-red-400 text-center bg-red-500/10 rounded-lg p-2">{localErr || error}</p>}

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
        <div>
          <label className="text-xs text-[var(--text-dim)] mb-1 block">{t('auth.repeatPassword')}</label>
          <input type="password" value={password2} onChange={e => setPassword2(e.target.value)} required
            className="studio-input" />
        </div>

        <button type="submit" disabled={loading}
          className="studio-primary-button w-full justify-center disabled:opacity-50">
          <UserPlus size={16} />
          {loading ? t('auth.creating') : t('auth.createAccount')}
        </button>

        <p className="text-center text-sm text-[var(--text-dim)]">
          {t('auth.hasAccount')} <Link to="/login" className="text-[var(--accent)] hover:underline">{t('auth.loginLink')}</Link>
        </p>
      </form>
    </div>
  )
}

import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate, Link } from 'react-router-dom'

export default function Register() {
  const { register, error, loading } = useAuthStore()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [localErr, setLocalErr] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== password2) { setLocalErr('Пароли не совпадают'); return }
    if (password.length < 4) { setLocalErr('Минимум 4 символа'); return }
    setLocalErr('')
    const ok = await register(username, password)
    if (ok) navigate('/')
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="text-center mb-6">
          <span className="text-4xl">🎧</span>
          <h1 className="text-xl font-bold text-[var(--text)] mt-2">Регистрация</h1>
        </div>

        {(error || localErr) && <p className="text-sm text-red-400 text-center bg-red-500/10 rounded-lg p-2">{localErr || error}</p>}

        <div>
          <label className="text-xs text-[var(--text-dim)] mb-1 block">Логин</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoFocus
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-dim)] mb-1 block">Пароль</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-dim)] mb-1 block">Повторите пароль</label>
          <input type="password" value={password2} onChange={e => setPassword2(e.target.value)} required
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-[var(--accent)] text-white rounded-lg py-3 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition">
          {loading ? 'Создание...' : 'Создать аккаунт'}
        </button>

        <p className="text-center text-sm text-[var(--text-dim)]">
          Уже есть аккаунт? <Link to="/login" className="text-[var(--accent)] hover:underline">Войти</Link>
        </p>
      </form>
    </div>
  )
}

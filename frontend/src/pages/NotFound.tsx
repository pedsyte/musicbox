import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <span className="text-6xl mb-4">🎵</span>
      <h1 className="text-4xl font-bold text-[var(--text)] mb-2">404</h1>
      <p className="text-[var(--text-dim)] mb-6">Страница не найдена</p>
      <Link to="/" className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition">
        На главную
      </Link>
    </div>
  )
}

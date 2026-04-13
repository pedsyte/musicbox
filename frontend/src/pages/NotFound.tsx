import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <span className="text-6xl mb-4">🎵</span>
      <h1 className="text-4xl font-bold text-[var(--text)] mb-2">404</h1>
      <p className="text-[var(--text-dim)] mb-6">{t('notFound.title')}</p>
      <Link to="/" className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition">
        {t('notFound.home')}
      </Link>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Music2 } from 'lucide-react'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--accent)]">
        <Music2 size={30} />
      </div>
      <h1 className="text-4xl font-bold text-[var(--text)] mb-2">404</h1>
      <p className="text-[var(--text-dim)] mb-6">{t('notFound.title')}</p>
      <Link to="/" className="studio-primary-button">
        <Home size={16} />
        {t('notFound.home')}
      </Link>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import type { Genre } from '@/lib/types'
import { Disc3, Music2 } from 'lucide-react'

const colorPalette = [
  'from-purple-600/30 to-violet-500/20',
  'from-pink-600/30 to-rose-500/20',
  'from-blue-600/30 to-cyan-500/20',
  'from-green-600/30 to-emerald-500/20',
  'from-orange-600/30 to-amber-500/20',
  'from-red-600/30 to-pink-500/20',
  'from-indigo-600/30 to-blue-500/20',
  'from-teal-600/30 to-cyan-500/20',
]

export default function Explore() {
  const { t } = useTranslation()
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/genres').then(res => {
      setGenres(res.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="studio-page space-y-5">
      <section className="studio-panel p-5 md:p-6">
        <div className="studio-kicker mb-2 flex items-center gap-2"><Disc3 size={14} />{t('explore.kicker', { defaultValue: 'Genre map' })}</div>
        <h1 className="studio-title text-2xl md:text-4xl">{t('explore.title')}</h1>
      </section>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {genres.map((genre, idx) => (
          <Link key={genre.id} to={`/browse?genres=${genre.id}`}
            className={`p-5 rounded-2xl bg-gradient-to-br ${colorPalette[idx % colorPalette.length]} border border-[var(--border)] hover:border-[var(--accent)]/40 transition group relative overflow-hidden min-h-32 flex flex-col justify-between`}>
            <Disc3 size={22} className="text-[var(--accent)]" />
            <div>
              <p className="text-base font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition">{genre.name}</p>
              <p className="text-sm text-[var(--text-dim)] mt-1 inline-flex items-center gap-1"><Music2 size={13} />{genre.track_count ?? 0} {t('common.track', { count: genre.track_count ?? 0 })}</p>
            </div>
          </Link>
        ))}
      </div>
      {genres.length === 0 && (
        <div className="text-center py-16 text-[var(--text-dim)]">
          <Disc3 size={36} className="mx-auto mb-2 text-[var(--accent)]" />
          <p>{t('explore.empty')}</p>
        </div>
      )}
    </div>
  )
}

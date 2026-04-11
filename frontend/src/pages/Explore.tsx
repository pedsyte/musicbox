import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import type { Genre } from '@/lib/types'
import { pluralize } from '@/lib/utils'

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
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/genres').then(res => {
      setGenres(res.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-bold text-[var(--text)] mb-4">Жанры</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {genres.map((genre, idx) => (
          <Link key={genre.id} to={`/browse?genres=${genre.id}`}
            className={`p-5 rounded-2xl bg-gradient-to-br ${colorPalette[idx % colorPalette.length]} border border-[var(--border)] hover:border-[var(--accent)]/40 transition group relative overflow-hidden`}>
            <p className="text-base font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition">{genre.name}</p>
            <p className="text-sm text-[var(--text-dim)] mt-1">{pluralize(genre.track_count ?? 0, 'трек', 'трека', 'треков')}</p>
          </Link>
        ))}
      </div>
      {genres.length === 0 && (
        <div className="text-center py-16 text-[var(--text-dim)]">
          <p className="text-3xl mb-2">🎭</p>
          <p>Жанры пока не добавлены</p>
        </div>
      )}
    </div>
  )
}

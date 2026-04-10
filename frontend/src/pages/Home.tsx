import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Track, Genre } from '@/lib/types'
import TrackCard from '@/components/TrackCard'
import { Link } from 'react-router-dom'
import { usePlayerStore } from '@/stores/playerStore'

export default function Home() {
  const [recent, setRecent] = useState<Track[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/tracks?limit=20&sort=newest'),
      api.get('/api/genres'),
    ]).then(([tracksRes, genresRes]) => {
      setRecent(tracksRes.data.tracks)
      setGenres(genresRes.data.filter((g: Genre) => g.track_count > 0).slice(0, 12))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Hero */}
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600/30 via-violet-500/20 to-fuchsia-600/30 p-6 md:p-10">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-4xl font-bold text-[var(--text)] mb-2">🎧 MusicBox</h1>
          <p className="text-[var(--text-dim)] text-sm md:text-base max-w-lg">Твоя коллекция AI-музыки. Слушай, создавай плейлисты и наслаждайся звуком.</p>
          <div className="flex gap-3 mt-4">
            <Link to="/browse" className="px-5 py-2.5 bg-[var(--accent)] text-white rounded-full text-sm font-medium hover:opacity-90 transition">Слушать</Link>
            <Link to="/explore" className="px-5 py-2.5 border border-[var(--border)] text-[var(--text)] rounded-full text-sm hover:bg-[var(--surface-hover)] transition">Жанры</Link>
          </div>
        </div>
      </section>

      {/* Recent tracks */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[var(--text)]">Новые треки</h2>
            <Link to="/browse?sort=newest" className="text-sm text-[var(--accent)] hover:underline">Все →</Link>
          </div>
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
            {recent.map((track, idx) => (
              <TrackCard key={track.id} track={track} tracks={recent} idx={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Genres grid */}
      {genres.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[var(--text)]">Жанры</h2>
            <Link to="/explore" className="text-sm text-[var(--accent)] hover:underline">Все →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {genres.map(genre => (
              <Link key={genre.id} to={`/browse?genres=${genre.id}`}
                className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[var(--accent)]/30 transition group">
                <p className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--accent)] transition">{genre.name}</p>
                <p className="text-xs text-[var(--text-dim)] mt-1">{genre.track_count} треков</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recent.length === 0 && (
        <div className="text-center py-20 text-[var(--text-dim)]">
          <p className="text-4xl mb-4">🎵</p>
          <p className="text-lg">Пока нет треков</p>
          <p className="text-sm mt-1">Загрузите треки через панель администратора</p>
        </div>
      )}
    </div>
  )
}

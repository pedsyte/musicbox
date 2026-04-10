import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Track, Genre, Playlist } from '@/lib/types'
import TrackCard from '@/components/TrackCard'
import { Link } from 'react-router-dom'

type Period = 'day' | 'week' | 'month' | 'all'

const PERIODS: { value: Period; label: string }[] = [
  { value: 'day', label: 'За день' },
  { value: 'week', label: 'За неделю' },
  { value: 'month', label: 'За месяц' },
  { value: 'all', label: 'Всё время' },
]

function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <Link to={`/playlist/${playlist.id}`}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:bg-[var(--surface-hover)] hover:border-[var(--accent)]/30 transition group">
      <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 bg-[var(--surface-hover)] grid grid-cols-2 grid-rows-2 gap-0.5">
        {(playlist.covers || []).slice(0, 4).map((c, i) => (
          c ? <img key={i} src={c} alt="" className="w-full h-full object-cover" />
            : <div key={i} className="w-full h-full flex items-center justify-center text-2xl bg-[var(--surface-hover)]">🎵</div>
        ))}
        {(!playlist.covers || playlist.covers.length === 0) && (
          <div className="col-span-2 row-span-2 flex items-center justify-center text-4xl">📋</div>
        )}
      </div>
      <p className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--accent)] transition truncate">{playlist.name}</p>
      <p className="text-xs text-[var(--text-dim)] mt-0.5">
        {playlist.track_count || 0} треков {playlist.username && `· ${playlist.username}`}
      </p>
    </Link>
  )
}

export default function Home() {
  const [newTracks, setNewTracks] = useState<Track[]>([])
  const [popular, setPopular] = useState<Track[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [period, setPeriod] = useState<Period>('week')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/tracks?limit=10&sort=newest'),
      api.get('/api/genres'),
      api.get('/api/playlists/public').catch(() => ({ data: [] })),
    ]).then(([tracksRes, genresRes, playlistsRes]) => {
      setNewTracks(tracksRes.data.tracks)
      setGenres(genresRes.data.filter((g: Genre) => (g.track_count ?? 0) > 0).slice(0, 12))
      setPlaylists(playlistsRes.data.slice(0, 8))
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    api.get(`/api/tracks/popular?period=${period}&limit=10`)
      .then(res => setPopular(res.data))
      .catch(() => setPopular([]))
  }, [period])

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

      {/* Popular tracks */}
      <section>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-[var(--text)]">🔥 Популярное</h2>
          <div className="flex gap-1 bg-[var(--surface)] rounded-lg border border-[var(--border)] p-0.5">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs rounded-md transition ${period === p.value ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-dim)] hover:bg-[var(--surface-hover)]'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {popular.length > 0 ? (
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
            {popular.map((track, idx) => (
              <TrackCard key={track.id} track={track} tracks={popular} idx={idx} />
            ))}
          </div>
        ) : (
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-8 text-center text-[var(--text-dim)] text-sm">
            Нет данных за этот период
          </div>
        )}
      </section>

      {/* New tracks */}
      {newTracks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[var(--text)]">✨ Новинки</h2>
            <Link to="/browse?sort=newest" className="text-sm text-[var(--accent)] hover:underline">Все →</Link>
          </div>
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
            {newTracks.map((track, idx) => (
              <TrackCard key={track.id} track={track} tracks={newTracks} idx={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Playlists */}
      {playlists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[var(--text)]">📋 Плейлисты</h2>
            <Link to="/playlists" className="text-sm text-[var(--accent)] hover:underline">Все →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {playlists.map(pl => (
              <PlaylistCard key={pl.id} playlist={pl} />
            ))}
          </div>
        </section>
      )}

      {/* Genres grid */}
      {genres.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[var(--text)]">🎭 Жанры</h2>
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

      {newTracks.length === 0 && (
        <div className="text-center py-20 text-[var(--text-dim)]">
          <p className="text-4xl mb-4">🎵</p>
          <p className="text-lg">Пока нет треков</p>
          <p className="text-sm mt-1">Загрузите треки через панель администратора</p>
        </div>
      )}
    </div>
  )
}

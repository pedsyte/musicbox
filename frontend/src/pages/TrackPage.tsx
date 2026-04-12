import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import type { Track, Genre } from '@/lib/types'
import { usePlayerStore } from '@/stores/playerStore'
import { useAuthStore } from '@/stores/authStore'
import Tooltip from '@/components/Tooltip'
import Waveform from '@/components/Waveform'
import DownloadMenu from '@/components/DownloadMenu'
import { formatTime } from '@/lib/utils'

export default function TrackPage() {
  const { id } = useParams()
  const [track, setTrack] = useState<Track | null>(null)
  const [peaks, setPeaks] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const { play, currentTrack, isPlaying, currentTime, duration, seek, playNext, addToQueue } = usePlayerStore()
  const { user } = useAuthStore()
  const [isFav, setIsFav] = useState(false)
  const [genreEditing, setGenreEditing] = useState(false)
  const [allGenres, setAllGenres] = useState<Genre[]>([])
  const [trackGenreIds, setTrackGenreIds] = useState<Set<number>>(new Set())
  const [newGenreName, setNewGenreName] = useState('')
  const genreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/api/tracks/${id}`),
      api.get(`/api/tracks/${id}/waveform`).catch(() => ({ data: { peaks: [] } })),
    ]).then(([trackRes, waveRes]) => {
      setTrack(trackRes.data)
      setPeaks(waveRes.data.peaks || [])
      setIsFav(trackRes.data.is_favorite ?? false)
      setTrackGenreIds(new Set((trackRes.data.genres || []).map((g: Genre) => g.id)))
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!genreEditing) return
    const handler = (e: MouseEvent) => {
      if (genreRef.current && !genreRef.current.contains(e.target as Node)) {
        setGenreEditing(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [genreEditing])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>
  if (!track) return <div className="text-center py-16 text-[var(--text-dim)]">Трек не найден</div>

  const isCurrent = currentTrack?.id === track.id
  const progress = isCurrent && duration > 0 ? currentTime / duration : 0

  const toggleFav = async () => {
    if (!user) return
    try {
      if (isFav) await api.delete(`/api/favorites/${track.id}`)
      else await api.post(`/api/favorites/${track.id}`)
      setIsFav(!isFav)
    } catch {}
  }

  const openGenreEditor = async () => {
    try {
      const res = await api.get('/api/genres/all')
      setAllGenres(res.data)
    } catch {}
    setGenreEditing(true)
  }

  const toggleGenre = async (genreId: number) => {
    const has = trackGenreIds.has(genreId)
    try {
      if (has) {
        await api.delete(`/api/genres/tracks/${track.id}/${genreId}`)
        setTrackGenreIds(prev => { const s = new Set(prev); s.delete(genreId); return s })
        setTrack(t => t ? { ...t, genres: t.genres?.filter(g => g.id !== genreId) || [] } : t)
      } else {
        await api.post(`/api/genres/tracks/${track.id}/${genreId}`)
        setTrackGenreIds(prev => new Set(prev).add(genreId))
        const genre = allGenres.find(g => g.id === genreId)
        if (genre) setTrack(t => t ? { ...t, genres: [...(t.genres || []), genre] } : t)
      }
    } catch {}
  }

  const addNewGenre = async () => {
    const name = newGenreName.trim()
    if (!name) return
    try {
      const res = await api.post('/api/admin/genres', { name })
      const genre = res.data
      setAllGenres(prev => [...prev, genre].sort((a, b) => a.name.localeCompare(b.name)))
      // Auto-assign to track
      await api.post(`/api/genres/tracks/${track.id}/${genre.id}`)
      setTrackGenreIds(prev => new Set(prev).add(genre.id))
      setTrack(t => t ? { ...t, genres: [...(t.genres || []), genre] } : t)
      setNewGenreName('')
    } catch {}
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] shrink-0 shadow-lg mx-auto md:mx-0">
          {track.cover_path ? (
            <img src={track.cover_path} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20">🎵</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--text-dim)] uppercase tracking-wider mb-1">Трек</p>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mb-1">{track.title}</h1>
          <a href={`/browse?artist=${encodeURIComponent(track.artist)}`} className="text-lg text-[var(--text-dim)] mb-3 hover:text-[var(--accent)] hover:underline transition block">{track.artist}</a>

          {/* Genre pills with admin editor */}
          <div className="relative mb-4" ref={genreRef}>
            <div className="flex flex-wrap gap-1.5 items-center">
              {track.genres && track.genres.length > 0 ? track.genres.map(g => (
                <Link key={g.id} to={`/browse?genres=${g.id}`}
                  className="px-2.5 py-1 text-xs rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition">
                  {g.name}
                </Link>
              )) : (
                <span className="text-xs text-[var(--text-dim)]">Нет жанров</span>
              )}
              {user?.is_admin && (
                <Tooltip text="Редактировать жанры">
                  <button onClick={genreEditing ? () => setGenreEditing(false) : openGenreEditor}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition ${genreEditing ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-dim)] hover:text-[var(--accent)] hover:bg-[var(--surface)]'}`}>
                    ✏️
                  </button>
                </Tooltip>
              )}
            </div>

            {genreEditing && user?.is_admin && (
              <div className="mt-2 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-2">
                <p className="text-xs text-[var(--text-dim)] font-medium">Выбрать жанры:</p>
                <div className="flex flex-wrap gap-1.5">
                  {allGenres.map(g => (
                    <button key={g.id} onClick={() => toggleGenre(g.id)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition ${
                        trackGenreIds.has(g.id)
                          ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                          : 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                      }`}>
                      {trackGenreIds.has(g.id) ? `✕ ${g.name}` : `+ ${g.name}`}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 items-center pt-1">
                  <input
                    value={newGenreName}
                    onChange={e => setNewGenreName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addNewGenre()}
                    placeholder="Новый жанр..."
                    className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  <button onClick={addNewGenre} className="px-3 py-1.5 bg-[var(--accent)] text-white rounded-lg text-xs hover:opacity-90 transition">Добавить</button>
                </div>
              </div>
            )}
          </div>

          <p className="text-sm text-[var(--text-dim)] mb-4">Длительность: {formatTime(track.duration_seconds)}</p>

          {track.description && (
            <p className="text-sm text-[var(--text-dim)] mb-4 italic">{track.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <Tooltip text={isCurrent && isPlaying ? 'Пауза' : 'Воспроизвести'}>
              <button onClick={() => play(track)}
                className="px-6 py-2.5 bg-[var(--accent)] text-white rounded-full text-sm font-medium hover:opacity-90 transition flex items-center gap-2">
                {isCurrent && isPlaying ? '⏸' : '▶'} {isCurrent && isPlaying ? 'Пауза' : 'Играть'}
              </button>
            </Tooltip>
            {user && (
              <Tooltip text={isFav ? 'Убрать из избранного' : 'В избранное'}>
                <button onClick={toggleFav}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition ${isFav ? 'border-red-400 text-red-400' : 'border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--text)]'}`}>
                  {isFav ? '❤️' : '🤍'}
                </button>
              </Tooltip>
            )}
            <Tooltip text="Играть следующим">
              <button onClick={() => playNext(track)} className="w-10 h-10 rounded-full border border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--text)] flex items-center justify-center transition text-sm">⏭</button>
            </Tooltip>
            <Tooltip text="Добавить в очередь">
              <button onClick={() => addToQueue(track)} className="w-10 h-10 rounded-full border border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--text)] flex items-center justify-center transition text-sm">+</button>
            </Tooltip>
            <DownloadMenu trackId={track.id} originalFormat={track.original_format || 'wav'} compact />
          </div>
        </div>
      </div>

      {/* Waveform */}
      {peaks.length > 0 && (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4">
          <p className="text-xs text-[var(--text-dim)] mb-2">Форма волны</p>
          <Waveform peaks={peaks} currentTime={isCurrent ? currentTime : 0} duration={isCurrent ? duration : track.duration_seconds} onSeek={isCurrent ? seek : () => play(track)} height={80} />
        </div>
      )}

      {/* Lyrics */}
      {track.lyrics && (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Текст</h2>
          <div className="text-sm text-[var(--text-dim)] whitespace-pre-wrap leading-relaxed">{track.lyrics}</div>
        </div>
      )}
    </div>
  )
}

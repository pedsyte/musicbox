import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import type { Track, Genre, Tag, Comment } from '@/lib/types'
import { usePlayerStore } from '@/stores/playerStore'
import { useAuthStore } from '@/stores/authStore'
import Tooltip from '@/components/Tooltip'
import Waveform from '@/components/Waveform'
import DownloadMenu from '@/components/DownloadMenu'
import { formatTime, pluralize } from '@/lib/utils'

export default function TrackPage() {
  const { slug } = useParams()
  const [track, setTrack] = useState<Track | null>(null)
  const [peaks, setPeaks] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const { play, currentTrack, isPlaying, currentTime, duration, seek, playNext, addToQueue } = usePlayerStore()
  const { user } = useAuthStore()
  const [isFav, setIsFav] = useState(false)

  // Genre editor
  const [genreEditing, setGenreEditing] = useState(false)
  const [allGenres, setAllGenres] = useState<Genre[]>([])
  const [trackGenreIds, setTrackGenreIds] = useState<Set<number>>(new Set())
  const [newGenreName, setNewGenreName] = useState('')
  const genreRef = useRef<HTMLDivElement>(null)

  // Comments
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [commentTotal, setCommentTotal] = useState(0)
  const [commentSending, setCommentSending] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/api/tracks/${slug}`).then(trackRes => {
      const t = trackRes.data
      setTrack(t)
      setIsFav(t.is_favorite ?? false)
      setTrackGenreIds(new Set((t.genres || []).map((g: Genre) => g.id)))
      setPeaks(t.waveform_peaks || [])
    }).finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (track?.id) fetchComments()
  }, [track?.id])

  const fetchComments = () => {
    if (!track?.id) return
    api.get(`/api/comments/${track.id}`).then(res => {
      setComments(res.data.comments)
      setCommentTotal(res.data.total)
    }).catch(() => {})
  }

  useEffect(() => {
    if (!genreEditing) return
    const handler = (e: MouseEvent) => {
      if (genreRef.current && !genreRef.current.contains(e.target as Node)) setGenreEditing(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [genreEditing])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>
  if (!track) return <div className="text-center py-16 text-[var(--text-dim)]">Трек не найден</div>

  const isCurrent = currentTrack?.id === track.id

  const toggleFav = async () => {
    if (!user) return
    try {
      if (isFav) await api.delete(`/api/favorites/${track.id}`)
      else await api.post(`/api/favorites/${track.id}`)
      setIsFav(!isFav)
    } catch {}
  }

  const openGenreEditor = async () => {
    try { const res = await api.get('/api/genres/all'); setAllGenres(res.data) } catch {}
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
      await api.post(`/api/genres/tracks/${track.id}/${genre.id}`)
      setTrackGenreIds(prev => new Set(prev).add(genre.id))
      setTrack(t => t ? { ...t, genres: [...(t.genres || []), genre] } : t)
      setNewGenreName('')
    } catch {}
  }

  const sendComment = async () => {
    if (!commentText.trim() || commentSending) return
    setCommentSending(true)
    try {
      await api.post(`/api/comments/${track.id}`, { text: commentText.trim() })
      setCommentText('')
      fetchComments()
    } catch {}
    setCommentSending(false)
  }

  const deleteComment = async (commentId: number) => {
    try {
      await api.delete(`/api/comments/${commentId}`)
      fetchComments()
    } catch {}
  }

  // Group tags by category
  const tagsByCategory: Record<string, { icon: string | null; name: string; tags: Tag[] }> = {}
  for (const tag of (track.tags || [])) {
    const key = tag.category_slug || 'other'
    if (!tagsByCategory[key]) tagsByCategory[key] = { icon: tag.category_icon || null, name: tag.category_name || 'Прочее', tags: [] }
    tagsByCategory[key].tags.push(tag)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatCommentDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'только что'
    if (mins < 60) return `${mins} мин. назад`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} ч. назад`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} дн. назад`
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-52 h-52 md:w-64 md:h-64 rounded-2xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] shrink-0 shadow-lg mx-auto md:mx-0">
          {track.cover_path ? (
            <img src={track.cover_path} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20">🎵</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--text-dim)] uppercase tracking-wider mb-1">Трек</p>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mb-1">{track.title}</h1>
          <a href={`/browse?artist=${encodeURIComponent(track.artist)}`}
            className="text-lg text-[var(--text-dim)] mb-3 hover:text-[var(--accent)] hover:underline transition block">{track.artist}</a>

          {/* Description */}
          {track.description && (
            <p className="text-sm text-[var(--text-dim)] mb-3 leading-relaxed">{track.description}</p>
          )}

          {/* Genre pills with admin editor */}
          <div className="relative mb-3" ref={genreRef}>
            <div className="flex flex-wrap gap-1.5 items-center">
              {track.genres && track.genres.length > 0 ? track.genres.map(g => (
                <Link key={g.id} to={`/browse?genres=${g.id}`}
                  className="px-2.5 py-1 text-xs rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition">
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
                  <input value={newGenreName} onChange={e => setNewGenreName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addNewGenre()} placeholder="Новый жанр..."
                    className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]" />
                  <button onClick={addNewGenre} className="px-3 py-1.5 bg-[var(--accent)] text-white rounded-lg text-xs hover:opacity-90 transition">Добавить</button>
                </div>
              </div>
            )}
          </div>

          {/* Meta info row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-dim)] mb-4">
            <span>⏱ {formatTime(track.duration_seconds)}</span>
            <span>▶ {pluralize(track.play_count, 'прослушивание', 'прослушивания', 'прослушиваний')}</span>
            <span>📥 {pluralize(track.download_count, 'скачивание', 'скачивания', 'скачиваний')}</span>
            <span>📅 {formatDate(track.uploaded_at)}</span>
            <span className="uppercase">🎧 {track.original_format || 'wav'}</span>
          </div>

          {/* Action buttons */}
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

      {/* Tags / Characteristics */}
      {Object.keys(tagsByCategory).length > 0 && (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">🏷️ Характеристики</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(tagsByCategory).map(([key, cat]) => (
              <div key={key} className="flex items-start gap-2">
                <span className="text-sm shrink-0 mt-0.5">{cat.icon || '🏷️'}</span>
                <div>
                  <p className="text-xs font-medium text-[var(--text-dim)] mb-1">{cat.name}</p>
                  <div className="flex flex-wrap gap-1">
                    {cat.tags.map(tag => (
                      <Link key={tag.id} to={`/browse?tags=${tag.id}`}
                        className="px-2 py-0.5 text-xs rounded-full bg-[var(--surface-hover)] text-[var(--text-dim)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition">
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lyrics */}
      {track.lyrics && (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">📝 Текст</h2>
          <div className="text-sm text-[var(--text-dim)] whitespace-pre-wrap leading-relaxed">{track.lyrics}</div>
        </div>
      )}

      {/* Comments */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-4">
          💬 Комментарии {commentTotal > 0 && <span className="text-[var(--text-dim)] font-normal">({commentTotal})</span>}
        </h2>

        {/* Comment form */}
        {user ? (
          <div className="flex gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center text-xs font-bold shrink-0">
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Напишите комментарий..."
                rows={2}
                maxLength={1000}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-[var(--text-dim)]">{commentText.length}/1000</span>
                <button
                  onClick={sendComment}
                  disabled={!commentText.trim() || commentSending}
                  className="px-4 py-1.5 bg-[var(--accent)] text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-40 transition">
                  {commentSending ? '...' : 'Отправить'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--text-dim)] mb-4">
            <Link to="/login" className="text-[var(--accent)] hover:underline">Войдите</Link>, чтобы оставить комментарий
          </p>
        )}

        {/* Comment list */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3 group">
                <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] text-[var(--text-dim)] flex items-center justify-center text-xs font-bold shrink-0">
                  {c.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-[var(--text)]">{c.username}</span>
                    <span className="text-[10px] text-[var(--text-dim)]">{formatCommentDate(c.created_at)}</span>
                    {(user?.is_admin || user?.id === c.user_id) && (
                      <button onClick={() => deleteComment(c.id)}
                        className="text-[10px] text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition">🗑</button>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-dim)] break-words">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-dim)] text-center py-4">Пока нет комментариев. Будьте первым!</p>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import type { Track, Genre, Tag, TagCategory, Comment } from '@/lib/types'
import { usePlayerStore } from '@/stores/playerStore'
import { useAuthStore } from '@/stores/authStore'
import Tooltip from '@/components/Tooltip'
import Waveform from '@/components/Waveform'
import DownloadMenu from '@/components/DownloadMenu'
import { formatTime } from '@/lib/utils'
import { AudioWaveform as WaveformIcon, Calendar, Download, Edit3, Heart, MessageCircle, Music2, Pause, Play, Plus, SkipForward, Tags, Trash2, X } from 'lucide-react'

export default function TrackPage() {
  const { slug } = useParams()
  const { t, i18n } = useTranslation()
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

  // Tag editor
  const [tagEditing, setTagEditing] = useState(false)
  const [allTagCategories, setAllTagCategories] = useState<TagCategory[]>([])
  const [trackTagIds, setTrackTagIds] = useState<Set<number>>(new Set())
  const tagRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    api.get(`/api/tracks/${slug}`).then(trackRes => {
      const t = trackRes.data
      setTrack(t)
      setIsFav(t.is_favorite ?? false)
      setTrackGenreIds(new Set((t.genres || []).map((g: Genre) => g.id)))
      setTrackTagIds(new Set((t.tags || []).map((tg: Tag) => tg.id)))
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

  useEffect(() => {
    if (!tagEditing) return
    const handler = (e: MouseEvent) => {
      if (tagRef.current && !tagRef.current.contains(e.target as Node)) setTagEditing(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [tagEditing])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>
  if (!track) return <div className="text-center py-16 text-[var(--text-dim)]">{t('track.notFound')}</div>

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

  const openTagEditor = async () => {
    try {
      const res = await api.get('/api/tags')
      setAllTagCategories(res.data)
    } catch {}
    setTagEditing(true)
  }

  const toggleTag = async (tag: Tag, catSlug: string, catIcon: string | null, catName: string) => {
    if (!track) return
    const has = trackTagIds.has(tag.id)
    try {
      if (has) {
        await api.delete(`/api/tags/tracks/${track.id}/${tag.id}`)
        setTrackTagIds(prev => { const s = new Set(prev); s.delete(tag.id); return s })
        setTrack(t => t ? { ...t, tags: (t.tags || []).filter(tg => tg.id !== tag.id) } : t)
      } else {
        await api.post(`/api/tags/tracks/${track.id}/${tag.id}`)
        setTrackTagIds(prev => new Set(prev).add(tag.id))
        const newTag: Tag = { ...tag, category_slug: catSlug, category_icon: catIcon, category_name: catName }
        setTrack(t => t ? { ...t, tags: [...(t.tags || []), newTag] } : t)
      }
    } catch {}
  }

  // Group tags by category
  const tagsByCategory: Record<string, { icon: string | null; name: string; tags: Tag[] }> = {}
  for (const tag of (track.tags || [])) {
    const key = tag.category_slug || 'other'
    if (!tagsByCategory[key]) tagsByCategory[key] = { icon: tag.category_icon || null, name: tag.category_name || t('track.other'), tags: [] }
    tagsByCategory[key].tags.push(tag)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatCommentDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return t('track.justNow')
    if (mins < 60) return t('track.minsAgo', { count: mins })
    const hours = Math.floor(mins / 60)
    if (hours < 24) return t('track.hoursAgo', { count: hours })
    const days = Math.floor(hours / 24)
    if (days < 7) return t('track.daysAgo', { count: days })
    return d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })
  }

  return (
    <div className="studio-page max-w-5xl space-y-6">
      {/* Header */}
      <div className="studio-panel p-5 md:p-6 flex flex-col md:flex-row gap-6 items-start overflow-hidden">
        <div className="w-56 h-56 md:w-72 md:h-72 rounded-[2rem] overflow-hidden bg-[var(--surface)] border border-[var(--border)] shrink-0 studio-cover-glow mx-auto md:mx-0">
          {track.cover_path ? (
            <img src={track.cover_path} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[linear-gradient(135deg,var(--accent),var(--accent-3))]"><Music2 size={72} className="text-white/90" /></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="studio-kicker mb-2">{t('track.label')}</p>
          <h1 className="studio-title text-3xl md:text-5xl mb-2">{track.title}</h1>
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
                <span className="text-xs text-[var(--text-dim)]">{t('track.noGenres')}</span>
              )}
              {user?.is_admin && (
                <Tooltip text={t('track.editGenres')}>
                  <button onClick={genreEditing ? () => setGenreEditing(false) : openGenreEditor}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition ${genreEditing ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-dim)] hover:text-[var(--accent)] hover:bg-[var(--surface)]'}`}>
                    <Edit3 size={13} />
                  </button>
                </Tooltip>
              )}
            </div>

            {genreEditing && user?.is_admin && (
              <div className="mt-2 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-2">
                <p className="text-xs text-[var(--text-dim)] font-medium">{t('track.selectGenres')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {allGenres.map(g => (
                    <button key={g.id} onClick={() => toggleGenre(g.id)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition inline-flex items-center gap-1 ${
                        trackGenreIds.has(g.id)
                          ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                          : 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                      }`}>
                      {trackGenreIds.has(g.id) ? <X size={11} /> : <Plus size={11} />}
                      {g.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 items-center pt-1">
                  <input value={newGenreName} onChange={e => setNewGenreName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addNewGenre()} placeholder={t('track.newGenrePlaceholder')}
                    className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]" />
                  <button onClick={addNewGenre} className="px-3 py-1.5 bg-[var(--accent)] text-white rounded-lg text-xs hover:opacity-90 transition">{t('track.add')}</button>
                </div>
              </div>
            )}
          </div>

          {/* Meta info row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-dim)] mb-4">
            <span>{formatTime(track.duration_seconds)}</span>
            <span className="inline-flex items-center gap-1"><Play size={12} />{track.play_count} {t('track.plays')}</span>
            <span className="inline-flex items-center gap-1"><Download size={12} />{track.download_count} {t('track.downloads')}</span>
            <span className="inline-flex items-center gap-1"><Calendar size={12} />{formatDate(track.uploaded_at)}</span>
            <span className="uppercase inline-flex items-center gap-1"><Music2 size={12} />{track.original_format || 'wav'}</span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Tooltip text={isCurrent && isPlaying ? t('track.pauseBtn') : t('track.playBtn')}>
              <button onClick={() => play(track)}
                className="studio-primary-button">
                {isCurrent && isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />} {isCurrent && isPlaying ? t('track.pauseBtn') : t('track.playBtn')}
              </button>
            </Tooltip>
            {user && (
              <Tooltip text={isFav ? t('track.removeFav') : t('track.addFav')}>
                <button onClick={toggleFav}
                  className={`studio-icon-button h-10 w-10 ${isFav ? 'border-[var(--accent-3)]/50 text-[var(--accent-3)]' : ''}`}>
                  <Heart size={17} fill={isFav ? 'currentColor' : 'none'} />
                </button>
              </Tooltip>
            )}
            <Tooltip text={t('track.playNext')}>
              <button onClick={() => playNext(track)} className="studio-icon-button h-10 w-10"><SkipForward size={17} /></button>
            </Tooltip>
            <Tooltip text={t('track.addToQueue')}>
              <button onClick={() => addToQueue(track)} className="studio-icon-button h-10 w-10"><Plus size={17} /></button>
            </Tooltip>
            <DownloadMenu trackId={track.id} originalFormat={track.original_format || 'wav'} compact />
          </div>
        </div>
      </div>

      {/* Waveform */}
      {peaks.length > 0 && (
        <div className="studio-panel-flat p-4">
          <p className="text-xs text-[var(--text-dim)] mb-2 inline-flex items-center gap-2"><WaveformIcon size={14} />{t('track.waveform')}</p>
          <Waveform peaks={peaks} currentTime={isCurrent ? currentTime : 0} duration={isCurrent ? duration : track.duration_seconds} onSeek={isCurrent ? seek : () => play(track)} height={80} />
        </div>
      )}

      {/* Tags / Characteristics */}
      <div className="studio-panel-flat p-5" ref={tagRef}>
        <div className="flex items-center gap-2 mb-3">
          <Tags size={16} className="text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-[var(--text)]">{t('track.characteristics')}</h2>
          {user?.is_admin && (
            <Tooltip text={t('track.editTags')}>
              <button onClick={tagEditing ? () => setTagEditing(false) : openTagEditor}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition ${tagEditing ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-dim)] hover:text-[var(--accent)] hover:bg-[var(--surface-hover)]'}`}>
                <Edit3 size={13} />
              </button>
            </Tooltip>
          )}
        </div>

        {Object.keys(tagsByCategory).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(tagsByCategory).map(([key, cat]) => (
              <div key={key} className="flex items-start gap-2">
                <Tags size={15} className="text-[var(--text-dim)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-[var(--text-dim)] mb-1">{t('tagCategories.' + key, { defaultValue: cat.name })}</p>
                  <div className="flex flex-wrap gap-1">
                    {cat.tags.map(tag => (
                      <Link key={tag.id} to={`/browse?tags=${tag.id}`}
                        className="px-2 py-0.5 text-xs rounded-full bg-[var(--surface-hover)] text-[var(--text-dim)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition">
                        {tag.translations?.[i18n.language] || tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-dim)]">{user?.is_admin ? t('track.noTagsAdmin') : t('track.noTags')}</p>
        )}

        {tagEditing && user?.is_admin && (
          <div className="mt-3 p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl space-y-3">
            <p className="text-xs text-[var(--text-dim)] font-medium">{t('track.selectTags')}</p>
            {allTagCategories.map(cat => (
              <div key={cat.id}>
                <p className="text-xs font-medium text-[var(--text)] mb-1">{t('tagCategories.' + cat.slug, { defaultValue: cat.name })}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.tags.map(tag => (
                    <button key={tag.id} onClick={() => toggleTag(tag, cat.slug, cat.icon, cat.name)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition inline-flex items-center gap-1 ${
                        trackTagIds.has(tag.id)
                          ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                          : 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                      }`}>
                      {trackTagIds.has(tag.id) ? <X size={11} /> : <Plus size={11} />}
                      {tag.translations?.[i18n.language] || tag.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lyrics */}
      {track.lyrics && (
        <div className="studio-panel-flat p-6">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">{t('track.lyrics')}</h2>
          <div className="text-sm text-[var(--text-dim)] whitespace-pre-wrap leading-relaxed">{track.lyrics}</div>
        </div>
      )}

      {/* Comments */}
      <div className="studio-panel-flat p-5">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-4 inline-flex items-center gap-2">
          <MessageCircle size={16} className="text-[var(--accent)]" />
          {t('track.comments')} {commentTotal > 0 && <span className="text-[var(--text-dim)] font-normal">({commentTotal})</span>}
        </h2>

        {/* Comment form */}
        {user ? (
          <div className="flex gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
              {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user.username[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder={t('track.commentPlaceholder')}
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
                  {commentSending ? '...' : t('track.commentSend')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--text-dim)] mb-4">
            <Link to="/login" className="text-[var(--accent)] hover:underline">{t('auth.loginBtn')}</Link>, {t('track.commentLoginPrompt')}
          </p>
        )}

        {/* Comment list */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3 group">
                <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] text-[var(--text-dim)] flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                  {c.avatar ? <img src={c.avatar} alt="" className="w-full h-full object-cover" /> : c.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-[var(--text)]">{c.username}</span>
                    <span className="text-[10px] text-[var(--text-dim)]">{formatCommentDate(c.created_at)}</span>
                    {(user?.is_admin || user?.id === c.user_id) && (
                      <button onClick={() => deleteComment(c.id)}
                        className="text-[10px] text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition"><Trash2 size={12} /></button>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-dim)] break-words">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-dim)] text-center py-4">{t('track.commentEmpty')}</p>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import type { Track, Genre, SortOption, TagCategory } from '@/lib/types'
import TrackCard from '@/components/TrackCard'
import { ChevronLeft, ChevronRight, Filter, ListFilter, Music2, Search, X } from 'lucide-react'

export default function Browse() {
  const { t, i18n } = useTranslation()
  const SORTS: { value: SortOption; label: string }[] = [
    { value: 'newest', label: t('browse.newest') },
    { value: 'oldest', label: t('browse.oldest') },
    { value: 'popular', label: t('browse.popular') },
    { value: 'title', label: t('browse.byTitle') },
    { value: 'artist', label: t('browse.byArtist') },
    { value: 'duration', label: t('browse.byDuration') },
  ]

  const [params, setParams] = useSearchParams()
  const [tracks, setTracks] = useState<Track[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const q = params.get('q') || ''
  const artistFilter = params.get('artist') || ''
  const sort = (params.get('sort') as SortOption) || 'newest'
  const includeGenres = params.get('genres')?.split(',').filter(Boolean).map(Number) || []
  const excludeGenres = params.get('exclude')?.split(',').filter(Boolean).map(Number) || []
  const includeTags = params.get('tags')?.split(',').filter(Boolean).map(Number) || []
  const limit = 30

  useEffect(() => {
    api.get('/api/genres').then(res => setGenres(res.data))
    api.get('/api/tags').then(res => setTagCategories(res.data)).catch(() => {})
  }, [])

  const fetchTracks = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      p.set('limit', String(limit))
      p.set('page', String(page))
      p.set('sort', sort)
      if (q) p.set('search', q)
      if (artistFilter) p.set('artist', artistFilter)
      if (includeGenres.length) p.set('genre_ids', includeGenres.join(','))
      if (excludeGenres.length) p.set('exclude_genre_ids', excludeGenres.join(','))
      if (includeTags.length) p.set('tag_ids', includeTags.join(','))
      const res = await api.get('/api/tracks?' + p.toString())
      setTracks(res.data.tracks)
      setTotal(res.data.total)
    } finally {
      setLoading(false)
    }
  }, [q, artistFilter, sort, includeGenres.join(','), excludeGenres.join(','), includeTags.join(','), page])

  useEffect(() => { fetchTracks() }, [fetchTracks])

  const toggleGenre = (id: number, type: 'include' | 'exclude') => {
    const p = new URLSearchParams(params)
    const key = type === 'include' ? 'genres' : 'exclude'
    const otherKey = type === 'include' ? 'exclude' : 'genres'
    const current = p.get(key)?.split(',').filter(Boolean).map(Number) || []
    const other = p.get(otherKey)?.split(',').filter(Boolean).map(Number) || []

    const otherFiltered = other.filter(g => g !== id)
    if (otherFiltered.length) p.set(otherKey, otherFiltered.join(','))
    else p.delete(otherKey)

    if (current.includes(id)) {
      const filtered = current.filter(g => g !== id)
      if (filtered.length) p.set(key, filtered.join(','))
      else p.delete(key)
    } else {
      p.set(key, [...current, id].join(','))
    }
    setPage(1)
    setParams(p)
  }

  const totalPages = Math.ceil(total / limit)
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="studio-page space-y-5">
      <section className="studio-panel p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="studio-kicker mb-2 flex items-center gap-2"><Music2 size={14} />{t('browse.libraryKicker', { defaultValue: 'Library console' })}</div>
            <h1 className="studio-title text-2xl md:text-4xl">
              {artistFilter ? t('browse.tracksBy', { artist: artistFilter }) : t('browse.browseTitle')}
            </h1>
          </div>
          <div className="text-sm text-[var(--text-dim)]">{total} {t('common.track', { count: total })}</div>
        </div>
      </section>
      {artistFilter && (
        <button onClick={() => { const p = new URLSearchParams(params); p.delete('artist'); setParams(p) }}
          className="text-sm text-[var(--accent)] hover:underline">{t('browse.allTracks')}</button>
      )}

      {/* Controls */}
      <div className="studio-panel-flat sticky top-[4.5rem] z-20 flex flex-wrap items-center gap-2 p-3">
        <select value={sort} onChange={e => { const p = new URLSearchParams(params); p.set('sort', e.target.value); setParams(p) }}
          className="studio-input rounded-2xl px-3 py-2 text-sm focus:outline-none">
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <button onClick={() => setShowFilters(!showFilters)}
          className={`studio-secondary-button min-h-0 px-3 py-2 text-sm ${excludeGenres.length ? 'border-red-500/50 text-red-400 bg-red-500/10' : ''}`}>
          <ListFilter size={16} /> {t('browse.excludeGenres')} {excludeGenres.length > 0 && '(' + excludeGenres.length + ')'}
        </button>

        {includeGenres.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {includeGenres.map(id => {
              const genre = genres.find(g => g.id === id)
              if (!genre) return null
              return (
                <span key={id} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
                  {genre.name}
                  <button onClick={() => toggleGenre(id, 'include')} className="hover:text-white transition"><X size={12} /></button>
                </span>
              )
            })}
            <button onClick={() => { const p = new URLSearchParams(params); p.delete('genres'); setParams(p) }}
              className="text-xs text-[var(--text-dim)] hover:text-[var(--accent)] transition">{t('browse.reset')}</button>
          </div>
        )}

        {includeTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {includeTags.map(id => {
              const tag = tagCategories.flatMap(c => c.tags).find(t => t.id === id)
              if (!tag) return null
              return (
                <span key={id} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
                  {tag.translations?.[i18n.language] || tag.name}
                  <button onClick={() => { const p = new URLSearchParams(params); const cur = includeTags.filter(t => t !== id); if (cur.length) p.set('tags', cur.join(',')); else p.delete('tags'); setParams(p) }}
                    className="hover:text-white transition"><X size={12} /></button>
                </span>
              )
            })}
            <button onClick={() => { const p = new URLSearchParams(params); p.delete('tags'); setParams(p) }}
              className="text-xs text-[var(--text-dim)] hover:text-[var(--accent)] transition">{t('browse.resetTags')}</button>
          </div>
        )}

        {q && (
          <span className="text-sm text-[var(--text-dim)] inline-flex items-center gap-2">
            <Search size={14} />
            {t('browse.searchLabel')} <span className="text-[var(--text)]">{q}</span>
          </span>
        )}

        <span className="ml-auto hidden text-sm text-[var(--text-dim)] md:inline">{total} {t('common.track', { count: total })}</span>
      </div>

      {/* Genre filters */}
      {showFilters && (
        <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl relative z-10">
          <p className="text-xs text-[var(--text-dim)] mb-2 flex items-center gap-2"><Filter size={14} />{t('browse.excludeHint')}</p>
          <div className="flex flex-wrap gap-1.5">
            {genres.map(genre => {
              const isExcluded = excludeGenres.includes(genre.id)
              return (
                <button key={genre.id}
                  onClick={() => toggleGenre(genre.id, 'exclude')}
                  className={`px-2.5 py-1 text-xs rounded-full border transition ${isExcluded ? 'bg-red-500/20 text-red-400 border-red-500/50 line-through' : 'border-[var(--border)] text-[var(--text-dim)] hover:bg-[var(--surface-hover)]'}`}>
                  {genre.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Track list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tracks.length > 0 ? (
        <div className="studio-track-list">
          {tracks.map((track, idx) => (
            <TrackCard key={track.id} track={track} tracks={tracks} idx={idx} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[var(--text-dim)]">
          <Search size={36} className="mx-auto mb-2 text-[var(--accent)]" />
          <p>{t('browse.noTracks')}</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="studio-icon-button h-9 w-9 disabled:opacity-30" aria-label={t('nav.back')}>
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-[var(--text-dim)]">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="studio-icon-button h-9 w-9 disabled:opacity-30" aria-label={t('nav.forward')}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

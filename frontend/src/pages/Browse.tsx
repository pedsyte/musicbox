import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '@/lib/api'
import type { Track, Genre, SortOption, TagCategory } from '@/lib/types'
import TrackCard from '@/components/TrackCard'
import { pluralize } from '@/lib/utils'

const SORTS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Новые' },
  { value: 'oldest', label: 'Старые' },
  { value: 'popular', label: 'Популярные' },
  { value: 'title', label: 'По названию' },
  { value: 'artist', label: 'По артисту' },
  { value: 'duration', label: 'По длительности' },
]

export default function Browse() {
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
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-bold text-[var(--text)] mb-4">
        {artistFilter ? `Треки: ${artistFilter}` : 'Обзор треков'}
      </h1>
      {artistFilter && (
        <button onClick={() => { const p = new URLSearchParams(params); p.delete('artist'); setParams(p) }}
          className="mb-4 text-sm text-[var(--accent)] hover:underline">← Все треки</button>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={sort} onChange={e => { const p = new URLSearchParams(params); p.set('sort', e.target.value); setParams(p) }}
          className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--accent)]">
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <button onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 text-sm rounded-lg border transition ${excludeGenres.length ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-[var(--border)] text-[var(--text-dim)] hover:bg-[var(--surface-hover)]'}`}>
          🚫 Исключить жанры {excludeGenres.length > 0 && '(' + excludeGenres.length + ')'}
        </button>

        {includeGenres.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {includeGenres.map(id => {
              const genre = genres.find(g => g.id === id)
              if (!genre) return null
              return (
                <span key={id} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
                  {genre.name}
                  <button onClick={() => toggleGenre(id, 'include')} className="hover:text-white transition">✕</button>
                </span>
              )
            })}
            <button onClick={() => { const p = new URLSearchParams(params); p.delete('genres'); setParams(p) }}
              className="text-xs text-[var(--text-dim)] hover:text-[var(--accent)] transition">Сбросить</button>
          </div>
        )}

        {includeTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {includeTags.map(id => {
              const tag = tagCategories.flatMap(c => c.tags).find(t => t.id === id)
              if (!tag) return null
              return (
                <span key={id} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
                  {tag.name}
                  <button onClick={() => { const p = new URLSearchParams(params); const cur = includeTags.filter(t => t !== id); if (cur.length) p.set('tags', cur.join(',')); else p.delete('tags'); setParams(p) }}
                    className="hover:text-white transition">✕</button>
                </span>
              )
            })}
            <button onClick={() => { const p = new URLSearchParams(params); p.delete('tags'); setParams(p) }}
              className="text-xs text-[var(--text-dim)] hover:text-[var(--accent)] transition">Сбросить теги</button>
          </div>
        )}

        {q && (
          <span className="text-sm text-[var(--text-dim)]">
            Поиск: <span className="text-[var(--text)]">{q}</span>
          </span>
        )}

        <span className="ml-auto text-sm text-[var(--text-dim)]">{pluralize(total, 'трек', 'трека', 'треков')}</span>
      </div>

      {/* Genre filters */}
      {showFilters && (
        <div className="mb-4 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl relative z-10">
          <p className="text-xs text-[var(--text-dim)] mb-2">Нажмите на жанр, чтобы исключить его из результатов</p>
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
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)]">
          {tracks.map((track, idx) => (
            <TrackCard key={track.id} track={track} tracks={tracks} idx={idx} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[var(--text-dim)]">
          <p className="text-3xl mb-2">🔍</p>
          <p>Треки не найдены</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 text-sm rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-dim)] hover:bg-[var(--surface-hover)] disabled:opacity-30 transition">←</button>
          <span className="text-sm text-[var(--text-dim)]">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 text-sm rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-dim)] hover:bg-[var(--surface-hover)] disabled:opacity-30 transition">→</button>
        </div>
      )}
    </div>
  )
}

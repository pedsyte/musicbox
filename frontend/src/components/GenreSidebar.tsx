import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import type { Genre, TagCategory } from '@/lib/types'
import { ChevronDown, ChevronRight, Filter, Plus, Tags, X } from 'lucide-react'

const colors = [
  'bg-cyan-400/12 text-cyan-300',
  'bg-lime-400/12 text-lime-300',
  'bg-rose-400/12 text-rose-300',
  'bg-amber-400/12 text-amber-300',
  'bg-violet-400/12 text-violet-300',
  'bg-sky-400/12 text-sky-300',
]

export default function GenreSidebar() {
  const { t, i18n } = useTranslation()
  const [genres, setGenres] = useState<Genre[]>([])
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([])
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('musicbox_sidebar_collapsed')
      if (saved) return JSON.parse(saved)
    } catch {}
    return { genres: true }  // collapsed by default
  })
  const { search } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/genres').then(res => setGenres(res.data)).catch(() => {})
    api.get('/api/tags').then(res => setTagCategories(res.data)).catch(() => {})
  }, [])

  if (genres.length === 0 && tagCategories.length === 0) return null

  const sp = new URLSearchParams(search)
  const includeGenres = sp.get('genres')?.split(',').filter(Boolean).map(Number) || []
  const includeTags = sp.get('tags')?.split(',').filter(Boolean).map(Number) || []

  const toggle = (key: string) => {
    setCollapsed(prev => {
      const next = { ...prev, [key]: !(prev[key] ?? true) }
      try { localStorage.setItem('musicbox_sidebar_collapsed', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const isCollapsed = (key: string) => collapsed[key] ?? true

  const addGenreToFilter = (genreId: number) => {
    const p = new URLSearchParams(search)
    const current = p.get('genres')?.split(',').filter(Boolean).map(Number) || []
    if (current.includes(genreId)) {
      const filtered = current.filter(id => id !== genreId)
      if (filtered.length) p.set('genres', filtered.join(','))
      else p.delete('genres')
    } else {
      p.set('genres', [...current, genreId].join(','))
    }
    const exc = p.get('exclude')?.split(',').filter(Boolean).map(Number) || []
    const excFiltered = exc.filter(id => id !== genreId)
    if (excFiltered.length) p.set('exclude', excFiltered.join(','))
    else p.delete('exclude')
    navigate('/browse?' + p.toString())
  }

  const addTagToFilter = (tagId: number) => {
    const p = new URLSearchParams(search)
    const current = p.get('tags')?.split(',').filter(Boolean).map(Number) || []
    if (current.includes(tagId)) {
      const filtered = current.filter(id => id !== tagId)
      if (filtered.length) p.set('tags', filtered.join(','))
      else p.delete('tags')
    } else {
      p.set('tags', [...current, tagId].join(','))
    }
    navigate('/browse?' + p.toString())
  }

  const genreActiveCount = includeGenres.length
  const tagActiveCount = (catSlug: string) => {
    const cat = tagCategories.find(c => c.slug === catSlug)
    if (!cat) return 0
    return cat.tags.filter(t => includeTags.includes(t.id)).length
  }

  const sorted = [...genres].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  const grouped: Record<string, Genre[]> = {}
  for (const g of sorted) {
    const letter = g.name[0].toUpperCase()
    if (!grouped[letter]) grouped[letter] = []
    grouped[letter].push(g)
  }
  const letters = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'ru'))

  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 border-l border-[var(--border)] bg-[var(--surface-soft)]/90 backdrop-blur-xl h-full overflow-y-auto">
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <span className="studio-icon-button h-9 w-9 text-[var(--accent)]">
            <Filter size={17} />
          </span>
          <div>
            <h3 className="studio-kicker">{t('sidebar.filters')}</h3>
            <p className="text-sm font-semibold text-[var(--text)]">{t('browse.filters', { defaultValue: 'Filters' })}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">

        {/* Genres section */}
        <div className="border-b border-[var(--border)]">
          <button onClick={() => toggle('genres')}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-hover)] transition">
            <span className="flex items-center gap-2">
              {t('sidebar.genresTitle')}
              {genreActiveCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">{genreActiveCount}</span>}
            </span>
            <span className="text-[var(--text-dim)]">{isCollapsed('genres') ? <ChevronRight size={15} /> : <ChevronDown size={15} />}</span>
          </button>
          {!isCollapsed('genres') && (
            <div className="px-3 pb-3 space-y-2">
              {letters.map(letter => (
                <div key={letter}>
                  <div className="text-[10px] font-bold text-[var(--accent)] uppercase mb-1 px-1 tracking-[0.18em]">{letter}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {grouped[letter].map((g, i) => {
                      const isIncluded = includeGenres.includes(g.id)
                      return (
                        <span key={g.id} className={`inline-flex items-center rounded-lg text-xs transition overflow-hidden border ${
                          isIncluded
                            ? 'border-[var(--accent)]/30 bg-[var(--accent)]/15 text-[var(--accent)] font-medium'
                            : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)]'
                        }`}>
                          <Link to={'/browse?genres=' + g.id}
                            className={'inline-flex items-center gap-1.5 pl-2.5 py-1 transition ' + (isIncluded ? '' : 'hover:text-[var(--text)]')}>
                            <span className="truncate">{g.name}</span>
                            <span className={'text-[9px] px-1 py-0.5 rounded-full ' + colors[i % colors.length]}>{g.track_count}</span>
                          </Link>
                          <button onClick={() => addGenreToFilter(g.id)}
                            title={isIncluded ? t('sidebar.removeFilter') : t('sidebar.addFilter')}
                            className={'px-2 py-1 transition border-l ' + (
                              isIncluded
                                ? 'border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/25'
                                : 'border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10'
                            )}>
                            {isIncluded ? <X size={11} /> : <Plus size={11} />}
                          </button>
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tag category sections */}
        {tagCategories.map((cat, ci) => {
          const activeCount = tagActiveCount(cat.slug)
          return (
            <div key={cat.id} className="border-b border-[var(--border)]">
              <button onClick={() => toggle(cat.slug)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-hover)] transition">
                <span className="flex items-center gap-2">
                  <Tags size={15} className="text-[var(--accent-3)]" /> {t('tagCategories.' + cat.slug, { defaultValue: cat.name })}
                  {activeCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">{activeCount}</span>}
                </span>
                <span className="text-[var(--text-dim)]">{isCollapsed(cat.slug) ? <ChevronRight size={15} /> : <ChevronDown size={15} />}</span>
              </button>
              {!isCollapsed(cat.slug) && (
                <div className="px-3 pb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {cat.tags.map((tag, ti) => {
                      const isActive = includeTags.includes(tag.id)
                      return (
                        <span key={tag.id} className={`inline-flex items-center rounded-lg text-xs transition overflow-hidden border ${
                          isActive
                            ? 'border-[var(--accent)]/30 bg-[var(--accent)]/15 text-[var(--accent)] font-medium'
                            : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)]'
                        }`}>
                          <Link to={'/browse?tags=' + tag.id}
                            className={'inline-flex items-center gap-1.5 pl-2.5 py-1 transition ' + (isActive ? '' : 'hover:text-[var(--text)]')}>
                            <span className="truncate">{tag.translations?.[i18n.language] || tag.name}</span>
                            {tag.track_count ? <span className={'text-[9px] px-1 py-0.5 rounded-full ' + colors[(ci * 3 + ti) % colors.length]}>{tag.track_count}</span> : null}
                          </Link>
                          <button onClick={() => addTagToFilter(tag.id)}
                            title={isActive ? t('sidebar.removeFilter') : t('sidebar.addFilter')}
                            className={'px-2 py-1 transition border-l ' + (
                              isActive
                                ? 'border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/25'
                                : 'border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10'
                            )}>
                            {isActive ? <X size={11} /> : <Plus size={11} />}
                          </button>
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}

      </div>
    </aside>
  )
}

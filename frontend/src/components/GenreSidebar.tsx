import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '@/lib/api'
import type { Genre } from '@/lib/types'

const colors = [
  'bg-purple-500/15 text-purple-400',
  'bg-pink-500/15 text-pink-400',
  'bg-blue-500/15 text-blue-400',
  'bg-green-500/15 text-green-400',
  'bg-orange-500/15 text-orange-400',
  'bg-red-500/15 text-red-400',
  'bg-indigo-500/15 text-indigo-400',
  'bg-teal-500/15 text-teal-400',
]

export default function GenreSidebar() {
  const [genres, setGenres] = useState<Genre[]>([])
  const { search } = useLocation()

  useEffect(() => {
    api.get('/api/genres').then(res => setGenres(res.data)).catch(() => {})
  }, [])

  if (genres.length === 0) return null

  const sorted = [...genres].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  const activeGenre = new URLSearchParams(search).get('genres')

  // Group by first letter
  const grouped: Record<string, Genre[]> = {}
  for (const g of sorted) {
    const letter = g.name[0].toUpperCase()
    if (!grouped[letter]) grouped[letter] = []
    grouped[letter].push(g)
  }
  const letters = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'ru'))

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-l border-[var(--border)] bg-[var(--surface)] h-full overflow-y-auto">
      <div className="p-4 border-b border-[var(--border)]">
        <h3 className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider">Жанры</h3>
      </div>
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {letters.map(letter => (
          <div key={letter}>
            <div className="text-[10px] font-bold text-[var(--accent)] uppercase mb-1 px-1">{letter}</div>
            <div className="flex flex-wrap gap-1.5">
              {grouped[letter].map((g, i) => {
                const isActive = activeGenre === String(g.id)
                return (
                  <Link
                    key={g.id}
                    to={`/browse?genres=${g.id}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition ${
                      isActive
                        ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium'
                        : 'bg-[var(--surface-hover)] text-[var(--text-dim)] hover:bg-[var(--accent)]/10 hover:text-[var(--text)]'
                    }`}
                  >
                    <span className="truncate">{g.name}</span>
                    <span className={`text-[9px] px-1 py-0.5 rounded-full ${colors[i % colors.length]}`}>
                      {g.track_count}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

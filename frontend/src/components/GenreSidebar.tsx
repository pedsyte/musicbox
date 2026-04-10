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

  const activeGenre = new URLSearchParams(search).get('genres')

  return (
    <aside className="hidden lg:flex flex-col w-52 shrink-0 border-l border-[var(--border)] bg-[var(--surface)] h-full overflow-y-auto">
      <div className="p-4 border-b border-[var(--border)]">
        <h3 className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider">Жанры</h3>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {genres.map((g, i) => {
          const isActive = activeGenre === String(g.id)
          return (
            <Link
              key={g.id}
              to={`/browse?genres=${g.id}`}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                isActive
                  ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium'
                  : 'text-[var(--text-dim)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
              }`}
            >
              <span className="truncate">{g.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${colors[i % colors.length]}`}>
                {g.track_count}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { Playlist } from '@/lib/types'
import { pluralize } from '@/lib/utils'

export default function Playlists() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [myPlaylists, setMyPlaylists] = useState<Playlist[]>([])
  const [publicPlaylists, setPublicPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPublic, setNewPublic] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const publicRes = await api.get('/api/playlists/public')
      setPublicPlaylists(publicRes.data)
      if (user) {
        const myRes = await api.get('/api/playlists')
        setMyPlaylists(myRes.data)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [user])

  const createPlaylist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      const res = await api.post('/api/playlists', { name: newName.trim(), is_public: newPublic })
      navigate(`/playlist/${res.data.id}`)
    } catch {}
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* My playlists */}
      {user && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[var(--text)]">Мои плейлисты</h2>
            <button onClick={() => setShowCreate(!showCreate)}
              className="text-sm text-[var(--accent)] hover:underline">+ Создать</button>
          </div>

          {showCreate && (
            <form onSubmit={createPlaylist} className="mb-4 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-[var(--text-dim)] mb-1 block">Название</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Мой плейлист"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]" />
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--text-dim)]">
                <input type="checkbox" checked={newPublic} onChange={e => setNewPublic(e.target.checked)} className="accent-[var(--accent)]" />
                Публичный
              </label>
              <button type="submit" className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm hover:opacity-90 transition">Создать</button>
            </form>
          )}

          {myPlaylists.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {myPlaylists.map(pl => (
                <Link key={pl.id} to={`/playlist/${pl.id}`}
                  className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition group">
                  <div className="w-full aspect-square rounded-lg bg-[var(--surface-hover)] mb-3 flex items-center justify-center text-4xl">📋</div>
                  <p className="text-sm font-medium text-[var(--text)] truncate">{pl.name}</p>
                  <p className="text-xs text-[var(--text-dim)]">{pluralize(pl.track_count ?? 0, 'трек', 'трека', 'треков')} · {pl.is_public ? 'Публичный' : 'Приватный'}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-dim)]">У вас пока нет плейлистов</p>
          )}
        </section>
      )}

      {/* Public playlists */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--text)] mb-3">Публичные плейлисты</h2>
        {publicPlaylists.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {publicPlaylists.map(pl => (
              <Link key={pl.id} to={`/playlist/${pl.id}`}
                className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition group">
                <div className="w-full aspect-square rounded-lg bg-[var(--surface-hover)] mb-3 flex items-center justify-center text-4xl">📋</div>
                <p className="text-sm font-medium text-[var(--text)] truncate">{pl.name}</p>
                <p className="text-xs text-[var(--text-dim)]">{pluralize(pl.track_count ?? 0, 'трек', 'трека', 'треков')}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-dim)]">Публичных плейлистов пока нет</p>
        )}
      </section>
    </div>
  )
}

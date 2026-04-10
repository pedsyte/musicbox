import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import type { Track, Genre, AdminStats } from '@/lib/types'
import { formatTime } from '@/lib/utils'
import Tooltip from '@/components/Tooltip'

type Tab = 'upload' | 'tracks' | 'genres' | 'stats'

export default function Admin() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('upload')

  useEffect(() => {
    if (!user?.is_admin) navigate('/')
  }, [user])

  if (!user?.is_admin) return null

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-bold text-[var(--text)]">⚙️ Панель управления</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--surface)] rounded-xl border border-[var(--border)] p-1">
        {([
          { v: 'upload', l: '📤 Загрузить' },
          { v: 'tracks', l: '🎵 Треки' },
          { v: 'genres', l: '🎭 Жанры' },
          { v: 'stats', l: '📊 Статистика' },
        ] as { v: Tab; l: string }[]).map(t => (
          <button key={t.v} onClick={() => setTab(t.v)}
            className={`flex-1 px-3 py-2 text-sm rounded-lg transition ${tab === t.v ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-dim)] hover:bg-[var(--surface-hover)]'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'upload' && <UploadTab />}
      {tab === 'tracks' && <TracksTab />}
      {tab === 'genres' && <GenresTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function UploadTab() {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [genreText, setGenreText] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!audioFile || !title.trim() || !artist.trim()) {
      setMsg('Заполните название, артиста и выберите WAV-файл')
      return
    }
    setUploading(true)
    setMsg('')
    try {
      const fd = new FormData()
      fd.append('title', title.trim())
      fd.append('artist', artist.trim())
      fd.append('audio', audioFile)
      if (coverFile) fd.append('cover', coverFile)
      if (lyrics.trim()) fd.append('lyrics', lyrics.trim())
      if (genreText.trim()) fd.append('genres', genreText.trim())
      await api.post('/api/admin/tracks', fd)
      setMsg('✅ Трек успешно загружен!')
      setTitle(''); setArtist(''); setLyrics(''); setGenreText(''); setAudioFile(null); setCoverFile(null)
    } catch (err: any) {
      setMsg(`❌ Ошибка: ${err.response?.data?.detail || err.message}`)
    } finally { setUploading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4 max-w-2xl">
      {msg && <p className={`text-sm p-3 rounded-lg ${msg.startsWith('✅') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{msg}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-[var(--text-dim)] mb-1 block">Название *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-dim)] mb-1 block">Артист *</label>
          <input value={artist} onChange={e => setArtist(e.target.value)} required
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-[var(--text-dim)] mb-1 block">Аудио (WAV) *</label>
          <input type="file" accept=".wav,audio/wav" onChange={e => setAudioFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-[var(--text-dim)] file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:text-white file:text-sm file:cursor-pointer" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-dim)] mb-1 block">Обложка (JPG/PNG)</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setCoverFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-[var(--text-dim)] file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-[var(--surface-hover)] file:text-[var(--text)] file:text-sm file:cursor-pointer" />
        </div>
      </div>

      <div>
        <label className="text-xs text-[var(--text-dim)] mb-1 block">Текст (необязательно)</label>
        <textarea value={lyrics} onChange={e => setLyrics(e.target.value)} rows={4}
          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] resize-y" />
      </div>

      <div>
        <label className="text-xs text-[var(--text-dim)] mb-1 block">Жанры (через запятую)</label>
        <input value={genreText} onChange={e => setGenreText(e.target.value)} placeholder="Pop, Rock, Electronic"
          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]" />
      </div>

      <button type="submit" disabled={uploading}
        className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition">
        {uploading ? '⏳ Конвертация и загрузка...' : '📤 Загрузить трек'}
      </button>
    </form>
  )
}

function TracksTab() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editArtist, setEditArtist] = useState('')

  const fetchTracks = () => {
    setLoading(true)
    api.get('/api/tracks?limit=200').then(res => setTracks(res.data.tracks)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchTracks() }, [])

  const startEdit = (t: Track) => { setEditingId(t.id); setEditTitle(t.title); setEditArtist(t.artist) }

  const saveEdit = async () => {
    if (!editingId) return
    await api.put(`/api/admin/tracks/${editingId}`, { title: editTitle.trim(), artist: editArtist.trim() })
    setEditingId(null)
    fetchTracks()
  }

  const deleteTrack = async (id: number) => {
    if (!confirm('Удалить трек?')) return
    await api.delete(`/api/admin/tracks/${id}`)
    fetchTracks()
  }

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="divide-y divide-[var(--border)]">
        {tracks.map(t => (
          <div key={t.id} className="flex items-center gap-3 p-3 hover:bg-[var(--surface-hover)] transition">
            <div className="w-10 h-10 rounded overflow-hidden bg-[var(--surface-hover)] shrink-0">
              {t.cover_path ? <img src={t.cover_path} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">🎵</div>}
            </div>
            {editingId === t.id ? (
              <div className="flex-1 flex gap-2 items-center">
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-sm text-[var(--text)] flex-1" />
                <input value={editArtist} onChange={e => setEditArtist(e.target.value)} className="bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-sm text-[var(--text)] w-32" />
                <button onClick={saveEdit} className="text-xs text-green-400 hover:text-green-300">✓</button>
                <button onClick={() => setEditingId(null)} className="text-xs text-[var(--text-dim)] hover:text-[var(--text)]">✕</button>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text)] truncate">{t.title}</p>
                  <p className="text-xs text-[var(--text-dim)] truncate">{t.artist}</p>
                </div>
                <span className="text-xs text-[var(--text-dim)]">{formatTime(t.duration_seconds)}</span>
                <Tooltip text="Редактировать"><button onClick={() => startEdit(t)} className="text-xs text-[var(--text-dim)] hover:text-[var(--accent)] px-1">✏️</button></Tooltip>
                <Tooltip text="Удалить"><button onClick={() => deleteTrack(t.id)} className="text-xs text-red-400 hover:text-red-300 px-1">🗑</button></Tooltip>
              </>
            )}
          </div>
        ))}
      </div>
      {tracks.length === 0 && <p className="text-center py-8 text-[var(--text-dim)]">Нет треков</p>}
    </div>
  )
}

function GenresTab() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  const fetchGenres = () => api.get('/api/genres').then(res => setGenres(res.data))
  useEffect(() => { fetchGenres() }, [])

  const addGenre = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    await api.post('/api/admin/genres', { name: newName.trim() })
    setNewName('')
    fetchGenres()
  }

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return
    await api.put(`/api/admin/genres/${editingId}`, { name: editName.trim() })
    setEditingId(null)
    fetchGenres()
  }

  const deleteGenre = async (id: number) => {
    if (!confirm('Удалить жанр?')) return
    await api.delete(`/api/admin/genres/${id}`)
    fetchGenres()
  }

  return (
    <div className="max-w-lg space-y-4">
      <form onSubmit={addGenre} className="flex gap-2">
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Новый жанр"
          className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]" />
        <button type="submit" className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm hover:opacity-90 transition">Добавить</button>
      </form>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl divide-y divide-[var(--border)]">
        {genres.map(g => (
          <div key={g.id} className="flex items-center gap-3 px-4 py-2.5">
            {editingId === g.id ? (
              <>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-sm text-[var(--text)]" />
                <button onClick={saveEdit} className="text-xs text-green-400">✓</button>
                <button onClick={() => setEditingId(null)} className="text-xs text-[var(--text-dim)]">✕</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-[var(--text)]">{g.name}</span>
                <span className="text-xs text-[var(--text-dim)]">{g.track_count} треков</span>
                <button onClick={() => { setEditingId(g.id); setEditName(g.name) }} className="text-xs text-[var(--text-dim)] hover:text-[var(--accent)]">✏️</button>
                <button onClick={() => deleteGenre(g.id)} className="text-xs text-red-400 hover:text-red-300">🗑</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function StatsTab() {
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    api.get('/api/admin/stats').then(res => setStats(res.data))
  }, [])

  if (!stats) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: 'Треков', value: stats.total_tracks, icon: '🎵' },
        { label: 'Жанров', value: stats.total_genres, icon: '🎭' },
        { label: 'Пользователей', value: stats.total_users, icon: '👤' },
        { label: 'Плейлистов', value: stats.total_playlists, icon: '📋' },
      ].map(s => (
        <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 text-center">
          <p className="text-2xl mb-1">{s.icon}</p>
          <p className="text-2xl font-bold text-[var(--text)]">{s.value}</p>
          <p className="text-xs text-[var(--text-dim)] mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

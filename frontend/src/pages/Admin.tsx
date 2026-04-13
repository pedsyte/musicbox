import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import type { Track, Genre, AdminStats, TagCategory } from '@/lib/types'
import { pluralize } from '@/lib/utils'
import { formatTime } from '@/lib/utils'
import Tooltip from '@/components/Tooltip'

type Tab = 'upload' | 'tracks' | 'genres' | 'tags' | 'stats' | 'settings'

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
      <div className="flex gap-1 bg-[var(--surface)] rounded-xl border border-[var(--border)] p-1 overflow-x-auto">
        {([
          { v: 'upload', l: '📤 Загрузить' },
          { v: 'tracks', l: '🎵 Треки' },
          { v: 'genres', l: '🎭 Жанры' },
          { v: 'tags', l: '🏷️ Теги' },
          { v: 'stats', l: '📊 Статистика' },
          { v: 'settings', l: '⚙️ Настройки' },
        ] as { v: Tab; l: string }[]).map(t => (
          <button key={t.v} onClick={() => setTab(t.v)}
            className={`flex-1 shrink-0 px-3 py-2 text-sm rounded-lg transition whitespace-nowrap ${tab === t.v ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-dim)] hover:bg-[var(--surface-hover)]'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'upload' && <UploadTab />}
      {tab === 'tracks' && <TracksTab />}
      {tab === 'genres' && <GenresTab />}
      {tab === 'tags' && <TagsTab />}
      {tab === 'stats' && <StatsTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  )
}

function UploadTab() {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [description, setDescription] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [genreText, setGenreText] = useState('')
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [tagTexts, setTagTexts] = useState<Record<string, string>>({})
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([])
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get('/api/tags').then(res => setTagCategories(res.data)).catch(() => {})
  }, [])

  const toggleTag = (id: number) => {
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

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
      if (description.trim()) fd.append('description', description.trim())
      if (lyrics.trim()) fd.append('lyrics', lyrics.trim())
      if (genreText.trim()) fd.append('genres', genreText.trim())
      if (selectedTags.length) fd.append('tag_ids', selectedTags.join(','))
      // Send tag texts as JSON for auto-creation
      const tagMap: Record<string, string> = {}
      for (const cat of tagCategories) {
        const txt = tagTexts[cat.slug]?.trim()
        if (txt) tagMap[cat.slug] = txt
      }
      if (Object.keys(tagMap).length) fd.append('tags_json', JSON.stringify(tagMap))
      await api.post('/api/admin/tracks', fd)
      setMsg('✅ Трек успешно загружен!')
      setTitle(''); setArtist(''); setDescription(''); setLyrics(''); setGenreText(''); setSelectedTags([]); setTagTexts({}); setAudioFile(null); setCoverFile(null)
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
          <label className="text-xs text-[var(--text-dim)] mb-1 block">Аудио (WAV, MP3, FLAC, OGG) *</label>
          <input type="file" accept=".wav,.mp3,.flac,.ogg,.aac,.m4a,audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-[var(--text-dim)] file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:text-white file:text-sm file:cursor-pointer" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-dim)] mb-1 block">Обложка (JPG/PNG)</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setCoverFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-[var(--text-dim)] file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-[var(--surface-hover)] file:text-[var(--text)] file:text-sm file:cursor-pointer" />
        </div>
      </div>

      <div>
        <label className="text-xs text-[var(--text-dim)] mb-1 block">Описание (необязательно)</label>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Короткое описание трека"
          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]" />
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

      {/* Tag inputs per category — type names, auto-created if new */}
      {tagCategories.length > 0 && (
        <div className="space-y-3">
          <label className="text-xs text-[var(--text-dim)] block">Характеристики (через запятую, создаются автоматически)</label>
          {tagCategories.map(cat => (
            <div key={cat.id}>
              <p className="text-xs font-medium text-[var(--text)] mb-1">{cat.icon} {cat.name}</p>
              <input
                value={tagTexts[cat.slug] || ''}
                onChange={e => setTagTexts(prev => ({ ...prev, [cat.slug]: e.target.value }))}
                placeholder={cat.tags.slice(0, 3).map(t => t.name).join(', ') + '...'}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
              {cat.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {cat.tags.map(tag => (
                    <button key={tag.id} type="button" onClick={() => {
                      const current = tagTexts[cat.slug] || ''
                      const names = current.split(',').map(s => s.trim()).filter(Boolean)
                      if (names.some(n => n.toLowerCase() === tag.name.toLowerCase())) return
                      setTagTexts(prev => ({ ...prev, [cat.slug]: names.length ? names.join(', ') + ', ' + tag.name : tag.name }))
                    }}
                      className={'px-2 py-0.5 text-[10px] rounded-full border transition ' + (
                        (tagTexts[cat.slug] || '').split(',').map(s => s.trim().toLowerCase()).includes(tag.name.toLowerCase())
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : 'border-[var(--border)] text-[var(--text-dim)] hover:bg-[var(--surface-hover)]'
                      )}>
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
  const [editGenres, setEditGenres] = useState('')

  const fetchTracks = () => {
    setLoading(true)
    api.get('/api/tracks?limit=100').then(res => setTracks(res.data.tracks)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchTracks() }, [])

  const startEdit = (t: Track) => { setEditingId(t.id); setEditTitle(t.title); setEditArtist(t.artist); setEditGenres(t.genres.map(g => g.name).join(', ')) }

  const saveEdit = async () => {
    if (!editingId) return
    const fd = new FormData()
    fd.append('title', editTitle.trim())
    fd.append('artist', editArtist.trim())
    fd.append('genres', editGenres.trim())
    await api.put(`/api/admin/tracks/${editingId}`, fd)
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
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Название" className="bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-sm text-[var(--text)] flex-1" />
                  <input value={editArtist} onChange={e => setEditArtist(e.target.value)} placeholder="Исполнитель" className="bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-sm text-[var(--text)] w-32" />
                  <button onClick={saveEdit} className="text-xs text-green-400 hover:text-green-300">✓</button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-[var(--text-dim)] hover:text-[var(--text)]">✕</button>
                </div>
                <input value={editGenres} onChange={e => setEditGenres(e.target.value)} placeholder="Жанры через запятую: Pop, Rock, Electronic" className="bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text)] w-full" />
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
                <span className="text-xs text-[var(--text-dim)]">{pluralize(g.track_count ?? 0, 'трек', 'трека', 'треков')}</span>
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

interface AdminTag { id: number; name: string; slug: string; track_count: number; enabled: boolean }
interface AdminTagCategory { id: number; name: string; slug: string; icon: string; tags: AdminTag[] }

function TagsTab() {
  const [categories, setCategories] = useState<AdminTagCategory[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [newTagCat, setNewTagCat] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  const fetchTags = () => api.get('/api/admin/tags').then(res => setCategories(res.data))
  useEffect(() => { fetchTags() }, [])

  const addTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim() || !newTagCat) return
    await api.post('/api/admin/tags', { name: newTagName.trim(), category_id: newTagCat })
    setNewTagName('')
    fetchTags()
  }

  const toggleEnabled = async (tag: AdminTag) => {
    await api.put(`/api/admin/tags/${tag.id}`, { enabled: !tag.enabled })
    fetchTags()
  }

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return
    await api.put(`/api/admin/tags/${editingId}`, { name: editName.trim() })
    setEditingId(null)
    fetchTags()
  }

  const deleteTag = async (id: number) => {
    if (!confirm('Удалить тег?')) return
    await api.delete(`/api/admin/tags/${id}`)
    fetchTags()
  }

  return (
    <div className="max-w-2xl space-y-4">
      <form onSubmit={addTag} className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-[var(--text-dim)] mb-1 block">Новый тег</label>
          <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="Название тега"
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-dim)] mb-1 block">Категория</label>
          <select value={newTagCat ?? ''} onChange={e => setNewTagCat(Number(e.target.value))}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]">
            <option value="">—</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <button type="submit" className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm hover:opacity-90 transition shrink-0">Добавить</button>
      </form>

      {categories.map(cat => (
        <div key={cat.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-[var(--surface-hover)] text-sm font-medium text-[var(--text)]">{cat.icon} {cat.name}</div>
          <div className="divide-y divide-[var(--border)]">
            {cat.tags.map(tag => (
              <div key={tag.id} className={'flex items-center gap-3 px-4 py-2 ' + (!tag.enabled ? 'opacity-50' : '')}>
                {editingId === tag.id ? (
                  <>
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-sm text-[var(--text)]" />
                    <button onClick={saveEdit} className="text-xs text-green-400">✓</button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-[var(--text-dim)]">✕</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => toggleEnabled(tag)}
                      className={'w-5 h-5 rounded border flex items-center justify-center text-xs transition ' + (
                        tag.enabled ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border)] text-transparent'
                      )}>✓</button>
                    <span className="flex-1 text-sm text-[var(--text)]">{tag.name}</span>
                    <span className="text-xs text-[var(--text-dim)]">{pluralize(tag.track_count, 'трек', 'трека', 'треков')}</span>
                    <button onClick={() => { setEditingId(tag.id); setEditName(tag.name) }} className="text-xs text-[var(--text-dim)] hover:text-[var(--accent)]">✏️</button>
                    <button onClick={() => deleteTag(tag.id)} className="text-xs text-red-400 hover:text-red-300">🗑</button>
                  </>
                )}
              </div>
            ))}
            {cat.tags.length === 0 && <p className="px-4 py-3 text-xs text-[var(--text-dim)]">Нет тегов</p>}
          </div>
        </div>
      ))}
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


function SettingsTab() {
  const [siteUrl, setSiteUrl] = useState('')
  const [staticMeta, setStaticMeta] = useState<{ key: string; value: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get('/api/admin/settings').then(res => {
      const data = res.data
      setSiteUrl(data.download_metadata_url || '')
      try {
        const parsed = JSON.parse(data.download_metadata_static || '{}')
        const entries = Object.entries(parsed).map(([k, v]) => ({ key: k, value: String(v) }))
        setStaticMeta(entries.length ? entries : [{ key: '', value: '' }])
      } catch {
        setStaticMeta([{ key: '', value: '' }])
      }
    })
  }, [])

  const save = async () => {
    setSaving(true)
    setMsg('')
    try {
      const staticObj: Record<string, string> = {}
      staticMeta.forEach(m => { if (m.key.trim()) staticObj[m.key.trim()] = m.value })
      await api.put('/api/admin/settings', {
        download_metadata_url: siteUrl,
        download_metadata_static: JSON.stringify(staticObj),
      })
      setMsg('Сохранено!')
    } catch {
      setMsg('Ошибка сохранения')
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(''), 3000)
    }
  }

  const addMeta = () => setStaticMeta([...staticMeta, { key: '', value: '' }])
  const removeMeta = (i: number) => setStaticMeta(staticMeta.filter((_, idx) => idx !== i))
  const updateMeta = (i: number, field: 'key' | 'value', val: string) => {
    const copy = [...staticMeta]
    copy[i] = { ...copy[i], [field]: val }
    setStaticMeta(copy)
  }

  const inputCls = "w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"

  return (
    <div className="space-y-6">
      {/* Site URL for metadata */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text)]">🌐 URL сайта (добавляется в метаданные)</h3>
        <p className="text-xs text-[var(--text-dim)]">Будет вписан в comment и url теги скачиваемых файлов</p>
        <input type="text" value={siteUrl} onChange={e => setSiteUrl(e.target.value)} placeholder="musicbox.gornich.fun" className={inputCls} />
      </div>

      {/* Static metadata tags */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text)]">🏷️ Статические метатеги</h3>
        <p className="text-xs text-[var(--text-dim)]">Добавляются ко всем скачиваемым трекам. Динамические теги (title, artist, genre) назначаются автоматически.</p>
        <div className="space-y-2">
          {staticMeta.map((m, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="text" value={m.key} onChange={e => updateMeta(i, 'key', e.target.value)}
                placeholder="Ключ (напр. copyright)" className={`${inputCls} flex-1`} />
              <input type="text" value={m.value} onChange={e => updateMeta(i, 'value', e.target.value)}
                placeholder="Значение" className={`${inputCls} flex-1`} />
              <button onClick={() => removeMeta(i)} className="text-red-400 hover:text-red-300 text-lg px-2 shrink-0">✕</button>
            </div>
          ))}
        </div>
        <button onClick={addMeta} className="text-sm text-[var(--accent)] hover:underline">+ Добавить тег</button>
      </div>

      {/* Dynamic metadata info */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-2">
        <h3 className="text-sm font-semibold text-[var(--text)]">🔄 Динамические метатеги (автоматические)</h3>
        <p className="text-xs text-[var(--text-dim)]">Эти теги добавляются автоматически из данных трека:</p>
        <div className="grid grid-cols-2 gap-1 text-xs text-[var(--text-dim)]">
          <span className="text-[var(--text)]">title</span><span>→ Название трека</span>
          <span className="text-[var(--text)]">artist</span><span>→ Исполнитель</span>
          <span className="text-[var(--text)]">genre</span><span>→ Жанры (через запятую)</span>
          <span className="text-[var(--text)]">comment</span><span>→ "Downloaded from {'{URL}'}"</span>
          <span className="text-[var(--text)]">url</span><span>→ URL сайта</span>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="px-6 py-2.5 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 text-sm font-medium">
          {saving ? 'Сохранение...' : 'Сохранить настройки'}
        </button>
        {msg && <span className={`text-sm ${msg.includes('Ошибка') ? 'text-red-400' : 'text-green-400'}`}>{msg}</span>}
      </div>
    </div>
  )
}

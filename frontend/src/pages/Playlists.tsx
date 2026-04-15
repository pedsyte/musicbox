import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { Playlist, CollectionGroup } from '@/lib/types'
import PlaylistCard from '@/components/PlaylistCard'
import CollectionCard from '@/components/CollectionCard'

export default function Playlists() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [myPlaylists, setMyPlaylists] = useState<Playlist[]>([])
  const [publicPlaylists, setPublicPlaylists] = useState<Playlist[]>([])
  const [collectionGroups, setCollectionGroups] = useState<CollectionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPublic, setNewPublic] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const publicRes = await api.get('/api/playlists/public')
      setPublicPlaylists(publicRes.data)
      try {
        const collectionsRes = await api.get('/api/collections')
        setCollectionGroups(collectionsRes.data)
      } catch { /* collections unavailable — show page without them */ }
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
            <h2 className="text-lg font-semibold text-[var(--text)]">{t('playlists.my')}</h2>
            <button onClick={() => setShowCreate(!showCreate)}
              className="text-sm text-[var(--accent)] hover:underline">{t('playlists.create')}</button>
          </div>

          {showCreate && (
            <form onSubmit={createPlaylist} className="mb-4 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-[var(--text-dim)] mb-1 block">{t('playlists.nameLabel')}</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={t('playlists.namePlaceholder')}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]" />
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--text-dim)]">
                <input type="checkbox" checked={newPublic} onChange={e => setNewPublic(e.target.checked)} className="accent-[var(--accent)]" />
                {t('playlists.public')}
              </label>
              <button type="submit" className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm hover:opacity-90 transition">{t('playlists.createBtn')}</button>
            </form>
          )}

          {myPlaylists.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {myPlaylists.map(pl => (
                <PlaylistCard key={pl.id} playlist={pl} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-dim)]">{t('playlists.empty')}</p>
          )}
        </section>
      )}

      {/* Smart collections */}
      {collectionGroups.map(group => (
        <section key={group.group_key}>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-3">{t(group.group_key)}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {group.collections.map(coll => (
              <CollectionCard key={coll.slug} collection={coll} />
            ))}
          </div>
        </section>
      ))}

      {/* Public playlists */}
      {publicPlaylists.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-3">{t('playlists.publicSection')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {publicPlaylists.map(pl => (
              <PlaylistCard key={pl.id} playlist={pl} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { usePlayerStore } from '@/stores/playerStore'
import type { Playlist, Track } from '@/lib/types'
import TrackCard from '@/components/TrackCard'
import Tooltip from '@/components/Tooltip'

export default function PlaylistPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPublic, setEditPublic] = useState(false)

  const fetchPlaylist = async () => {
    try {
      const res = await api.get(`/api/playlists/${id}`)
      setPlaylist(res.data)
      setEditName(res.data.name)
      setEditPublic(res.data.is_public)
    } catch { navigate('/playlists') }
    finally { setLoading(false) }
  }

  useEffect(() => { setLoading(true); fetchPlaylist() }, [id])

  const isOwner = user && playlist && (playlist.is_owner || user.id === playlist.user_id)

  const saveEdit = async () => {
    if (!editName.trim()) return
    await api.put(`/api/playlists/${id}`, { name: editName.trim(), is_public: editPublic })
    setEditing(false)
    fetchPlaylist()
  }

  const deletePlaylist = async () => {
    if (!confirm(t('playlist.deleteConfirm'))) return
    await api.delete(`/api/playlists/${id}`)
    navigate('/playlists')
  }

  const removeTrack = async (trackId: number) => {
    await api.delete(`/api/playlists/${id}/tracks/${trackId}`)
    fetchPlaylist()
  }

  const playAll = () => {
    if (!playlist?.tracks?.length) return
    usePlayerStore.getState().setQueue(playlist.tracks, 0)
    usePlayerStore.getState().play(playlist.tracks[0])
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>
  if (!playlist) return null

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="w-40 h-40 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-6xl shrink-0 shadow-lg">📋</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--text-dim)] uppercase tracking-wider mb-1">{playlist.is_public ? t('playlist.publicLabel') : t('playlist.privateLabel')}</p>
          {editing ? (
            <div className="space-y-2 mb-3">
              <input value={editName} onChange={e => setEditName(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-lg text-[var(--text)] font-bold focus:outline-none focus:border-[var(--accent)]" />
              <label className="flex items-center gap-2 text-sm text-[var(--text-dim)]">
                <input type="checkbox" checked={editPublic} onChange={e => setEditPublic(e.target.checked)} className="accent-[var(--accent)]" />
                {t('playlists.public')}
              </label>
              <div className="flex gap-2">
                <button onClick={saveEdit} className="px-3 py-1.5 bg-[var(--accent)] text-white rounded-lg text-sm">{t('playlist.save')}</button>
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 border border-[var(--border)] text-[var(--text-dim)] rounded-lg text-sm">{t('playlist.cancel')}</button>
              </div>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-[var(--text)] mb-1">{playlist.name}</h1>
          )}
          <p className="text-sm text-[var(--text-dim)]">{playlist.track_count ?? playlist.tracks?.length ?? 0} {t('common.track')}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            {playlist.tracks && playlist.tracks.length > 0 && (
              <button onClick={playAll} className="px-5 py-2.5 bg-[var(--accent)] text-white rounded-full text-sm font-medium hover:opacity-90 transition">{t('playlist.playAll')}</button>
            )}
            {isOwner && !editing && (
              <>
                <Tooltip text={t('playlist.edit')}>
                  <button onClick={() => setEditing(true)} className="w-10 h-10 rounded-full border border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--text)] flex items-center justify-center transition">✏️</button>
                </Tooltip>
                <Tooltip text={t('playlist.deletePlaylist')}>
                  <button onClick={deletePlaylist} className="w-10 h-10 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center justify-center transition">🗑</button>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tracks */}
      {playlist.tracks && playlist.tracks.length > 0 ? (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)]">
          {playlist.tracks.map((track, idx) => (
            <div key={track.id} className="flex items-center">
              <div className="flex-1"><TrackCard track={track} tracks={playlist.tracks} idx={idx} /></div>
              {isOwner && (
                <Tooltip text={t('playlist.removeFromPlaylist')}>
                  <button onClick={() => removeTrack(track.id)} className="px-3 text-sm text-red-400 hover:text-red-300 transition">✕</button>
                </Tooltip>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-[var(--text-dim)]">
          <p className="text-3xl mb-2">📋</p>
          <p>{t('playlist.empty')}</p>
        </div>
      )}
    </div>
  )
}

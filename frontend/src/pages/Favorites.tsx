import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { Track } from '@/lib/types'
import TrackCard from '@/components/TrackCard'

export default function Favorites() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    api.get('/api/favorites').then(res => setTracks(res.data)).finally(() => setLoading(false))
  }, [user])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-bold text-[var(--text)] mb-4">{t('favorites.title')}</h1>
      {tracks.length > 0 ? (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
          {tracks.map((track, idx) => (
            <TrackCard key={track.id} track={track} tracks={tracks} idx={idx} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[var(--text-dim)]">
          <p className="text-3xl mb-2">🤍</p>
          <p>{t('favorites.empty')}</p>
          <p className="text-sm mt-1">{t('favorites.hint')}</p>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { Track } from '@/lib/types'
import TrackCard from '@/components/TrackCard'
import { Heart } from 'lucide-react'

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
    <div className="studio-page space-y-5">
      <section className="studio-panel p-5 md:p-6">
        <div className="studio-kicker mb-2 flex items-center gap-2"><Heart size={14} />{t('favorites.kicker', { defaultValue: 'Saved music' })}</div>
        <h1 className="studio-title text-2xl md:text-4xl">{t('favorites.title')}</h1>
      </section>
      {tracks.length > 0 ? (
        <div className="studio-track-list">
          {tracks.map((track, idx) => (
            <TrackCard key={track.id} track={track} tracks={tracks} idx={idx} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[var(--text-dim)]">
          <Heart size={36} className="mx-auto mb-2 text-[var(--accent-3)]" />
          <p>{t('favorites.empty')}</p>
          <p className="text-sm mt-1">{t('favorites.hint')}</p>
        </div>
      )}
    </div>
  )
}

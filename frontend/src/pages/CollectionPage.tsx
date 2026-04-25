import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { usePlayerStore } from '@/stores/playerStore'
import type { Collection } from '@/lib/types'
import TrackCard from '@/components/TrackCard'
import { Layers3, Play } from 'lucide-react'

export default function CollectionPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/api/collections/${slug}`)
      .then(res => setCollection(res.data))
      .catch(() => navigate('/playlists'))
      .finally(() => setLoading(false))
  }, [slug])

  const playAll = () => {
    if (!collection?.tracks?.length) return
    usePlayerStore.getState().setQueue(collection.tracks, 0)
    usePlayerStore.getState().play(collection.tracks[0])
  }

  const displayName = collection
    ? (collection.name || (collection.name_key ? t(collection.name_key) : slug))
    : ''

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>
  if (!collection) return null

  return (
    <div className="studio-page max-w-4xl space-y-6">
      {/* Header */}
      <div className="studio-panel p-5 md:p-6 flex flex-col md:flex-row gap-4 items-start">
        <div className="w-44 h-44 rounded-[2rem] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0 studio-cover-glow overflow-hidden">
          {collection.covers?.filter(Boolean).length ? (
            <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
              {(collection.covers.filter(Boolean) as string[]).slice(0, 4).map((c, i) => (
                <img key={i} src={c} alt="" className="w-full h-full object-cover" />
              ))}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,var(--accent),var(--accent-2))]"><Layers3 size={58} className="text-[#061018]" /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="studio-kicker mb-2">
            {collection.group_key ? t(collection.group_key) : t('collections.title')}
          </p>
          <h1 className="studio-title text-3xl md:text-5xl mb-2">
            {displayName}
          </h1>
          <p className="text-sm text-[var(--text-dim)]">
            {collection.track_count} {t('common.track')}
          </p>

          {collection.tracks && collection.tracks.length > 0 && (
            <button onClick={playAll}
              className="studio-primary-button mt-3">
              <Play size={17} fill="currentColor" />
              {t('playlist.playAll')}
            </button>
          )}
        </div>
      </div>

      {/* Track list */}
      {collection.tracks && collection.tracks.length > 0 ? (
        <div className="studio-track-list">
          {collection.tracks.map((track, idx) => (
            <TrackCard
              key={track.id}
              track={track}
              idx={idx}
              tracks={collection.tracks!}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-[var(--text-dim)] py-12">{t('playlist.empty')}</p>
      )}
    </div>
  )
}

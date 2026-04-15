import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { usePlayerStore } from '@/stores/playerStore'
import type { Collection } from '@/lib/types'
import TrackCard from '@/components/TrackCard'

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
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="w-40 h-40 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-6xl shrink-0 shadow-lg overflow-hidden">
          {collection.covers?.filter(Boolean).length ? (
            <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
              {(collection.covers.filter(Boolean) as string[]).slice(0, 4).map((c, i) => (
                <img key={i} src={c} alt="" className="w-full h-full object-cover" />
              ))}
            </div>
          ) : (
            <span>{collection.icon}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--text-dim)] uppercase tracking-wider mb-1">
            {collection.group_key ? t(collection.group_key) : t('collections.title')}
          </p>
          <h1 className="text-2xl font-bold text-[var(--text)] mb-1">
            {collection.icon} {displayName}
          </h1>
          <p className="text-sm text-[var(--text-dim)]">
            {collection.track_count} {t('common.track')}
          </p>

          {collection.tracks && collection.tracks.length > 0 && (
            <button onClick={playAll}
              className="mt-3 px-5 py-2.5 bg-[var(--accent)] text-white rounded-full text-sm font-medium hover:opacity-90 transition">
              {t('playlist.playAll')}
            </button>
          )}
        </div>
      </div>

      {/* Track list */}
      {collection.tracks && collection.tracks.length > 0 ? (
        <div className="space-y-1">
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

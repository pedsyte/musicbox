import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Collection } from '@/lib/types'

function formatDuration(seconds: number, t: (key: string) => string): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h} ${t('common.h')} ${m} ${t('common.min')}`
  return `${m} ${t('common.min')}`
}

export default function CollectionCard({ collection }: { collection: Collection }) {
  const { t } = useTranslation()
  const covers = (collection.covers || []).filter(Boolean) as string[]
  const count = collection.track_count || 0
  const duration = collection.total_duration || 0
  const previews = collection.preview_tracks || []
  const displayName = collection.name || (collection.name_key ? t(collection.name_key) : collection.slug)

  return (
    <Link to={`/collection/${collection.slug}`}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:bg-[var(--surface-hover)] hover:border-[var(--accent)]/30 transition group flex flex-col">
      {/* Cover */}
      <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 bg-[var(--surface-hover)] relative">
        {covers.length === 0 && (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--surface-hover)]">{collection.icon}</div>
        )}
        {covers.length === 1 && (
          <img src={covers[0]} alt="" className="w-full h-full object-cover" />
        )}
        {covers.length === 2 && (
          <div className="w-full h-full grid grid-cols-2 gap-0.5">
            {covers.map((c, i) => <img key={i} src={c} alt="" className="w-full h-full object-cover" />)}
          </div>
        )}
        {covers.length === 3 && (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
            <img src={covers[0]} alt="" className="w-full h-full object-cover row-span-2" />
            <img src={covers[1]} alt="" className="w-full h-full object-cover" />
            <img src={covers[2]} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {covers.length >= 4 && (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
            {covers.slice(0, 4).map((c, i) => <img key={i} src={c} alt="" className="w-full h-full object-cover" />)}
          </div>
        )}
        {/* Badge */}
        {count > 0 && (
          <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1.5">
            <span>{count} {t('common.track')}</span>
            {duration > 0 && <><span className="opacity-50">·</span><span>{formatDuration(duration, t)}</span></>}
          </div>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--accent)] transition truncate">
        {collection.icon} {displayName}
      </p>

      {/* Track previews */}
      {previews.length > 0 && (
        <div className="mt-1.5 space-y-0.5">
          {previews.slice(0, 3).map((tr, i) => (
            <p key={i} className="text-[10px] text-[var(--text-dim)] truncate leading-tight">
              <span className="text-[var(--text-dim)]/60">{i + 1}.</span> {tr.artist} — {tr.title}
            </p>
          ))}
          {count > 3 && (
            <p className="text-[10px] text-[var(--text-dim)]/50 leading-tight">{t('common.andMore', { count: count - 3 })}</p>
          )}
        </div>
      )}
    </Link>
  )
}

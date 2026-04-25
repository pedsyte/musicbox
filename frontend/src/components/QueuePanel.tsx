import { usePlayerStore } from '@/stores/playerStore'
import { useTranslation } from 'react-i18next'
import Tooltip from './Tooltip'
import { formatTime } from '@/lib/utils'
import { useRef } from 'react'
import { GripVertical, ListMusic, Music2, Play, Trash2, X } from 'lucide-react'

export default function QueuePanel() {
  const { showQueue, toggleQueue, currentTrack, queue, queueSource, clearQueue, removeFromQueue, reorderQueue, play } = usePlayerStore()
  const { t } = useTranslation()
  const dragIdx = useRef<number | null>(null)
  const dragOverIdx = useRef<number | null>(null)

  if (!showQueue) return null

  const handleDragStart = (idx: number) => { dragIdx.current = idx }
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); dragOverIdx.current = idx }
  const handleDrop = () => {
    if (dragIdx.current !== null && dragOverIdx.current !== null && dragIdx.current !== dragOverIdx.current) {
      reorderQueue(dragIdx.current, dragOverIdx.current)
    }
    dragIdx.current = null
    dragOverIdx.current = null
  }

  return (
    <>
      {/* Backdrop on mobile */}
      <div className="md:hidden fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" onClick={toggleQueue} />

      <div className="fixed top-0 right-0 z-[61] w-full md:w-96 h-full bg-[var(--player-bg)] border-l border-[var(--border-strong)] shadow-2xl backdrop-blur-2xl flex flex-col md:bottom-20 md:h-auto md:rounded-l-2xl" style={{ maxHeight: 'calc(100vh - 5rem)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <span className="studio-icon-button h-9 w-9 text-[var(--accent)]">
              <ListMusic size={18} />
            </span>
            <div>
              <p className="studio-kicker">{t('queue.title')}</p>
              <h2 className="text-base font-semibold text-[var(--text)]">{t('queue.next', { count: queue.length })}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip text={t('queue.clearTooltip')}>
              <button onClick={clearQueue} className="studio-secondary-button px-3 py-1.5 text-xs">{t('queue.clear')}</button>
            </Tooltip>
            <Tooltip text={t('queue.close')}>
              <button onClick={toggleQueue} className="studio-icon-button h-9 w-9" aria-label={t('queue.close')}>
                <X size={17} />
              </button>
            </Tooltip>
          </div>
        </div>

        {queueSource && (
          <div className="px-4 py-2 text-xs text-[var(--text-dim)] border-b border-[var(--border)] bg-[var(--surface-soft)]">
            {t('queue.source')} {queueSource}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* Now Playing */}
          {currentTrack && (
            <div className="px-4 pt-3 pb-1">
              <p className="studio-kicker mb-2">{t('queue.nowPlaying')}</p>
              <div className="flex items-center gap-3 p-2 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 shadow-[inset_0_0_0_1px_rgba(255,255,255,.04)]">
                <div className="w-11 h-11 rounded-lg overflow-hidden bg-[var(--surface-hover)] shrink-0">
                  {currentTrack.cover_path ? (
                    <img src={currentTrack.cover_path} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-dim)]"><Music2 size={18} /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text)] truncate">{currentTrack.title}</p>
                  <a href={`/browse?artist=${encodeURIComponent(currentTrack.artist)}`} className="text-xs text-[var(--text-dim)] truncate hover:text-[var(--accent)] hover:underline transition block">{currentTrack.artist}</a>
                </div>
                <span className="text-xs text-[var(--text-dim)]">{formatTime(currentTrack.duration_seconds)}</span>
              </div>
            </div>
          )}

          {/* Up Next */}
          {queue.length > 0 && (
            <div className="px-4 pt-3 pb-20 md:pb-4">
              <p className="studio-kicker mb-2">{t('queue.next', { count: queue.length })}</p>
              <div className="space-y-1.5">
                {queue.map((track, idx) => (
                  <div key={`${track.id}-${idx}`}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={handleDrop}
                    className="flex items-center gap-2 p-2 rounded-xl border border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-hover)] group transition cursor-grab active:cursor-grabbing"
                  >
                    <Tooltip text={t('queue.dragTooltip')}>
                      <span className="text-[var(--text-dim)] cursor-grab"><GripVertical size={16} /></span>
                    </Tooltip>
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-[var(--surface-hover)] shrink-0">
                      {track.cover_path ? (
                        <img src={track.cover_path} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-dim)]"><Music2 size={15} /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--text)] truncate">{track.title}</p>
                      <a href={`/browse?artist=${encodeURIComponent(track.artist)}`} className="text-xs text-[var(--text-dim)] truncate hover:text-[var(--accent)] hover:underline transition block">{track.artist}</a>
                    </div>
                    <span className="text-xs text-[var(--text-dim)]">{formatTime(track.duration_seconds)}</span>
                    <div className="flex md:hidden md:group-hover:flex items-center gap-1">
                      <Tooltip text={t('queue.playTooltip')}>
                        <button onClick={() => play(track)} className="studio-icon-button h-7 w-7 text-[var(--accent)]" aria-label={t('queue.playTooltip')}>
                          <Play size={13} fill="currentColor" />
                        </button>
                      </Tooltip>
                      <Tooltip text={t('queue.removeTooltip')}>
                        <button onClick={() => removeFromQueue(idx)} className="studio-icon-button h-7 w-7 hover:text-red-400" aria-label={t('queue.removeTooltip')}>
                          <Trash2 size={13} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {queue.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-[var(--text-dim)]">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--accent)]">
                <ListMusic size={21} />
              </div>
              <p>{t('queue.empty')}</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

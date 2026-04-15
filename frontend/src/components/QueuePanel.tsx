import { usePlayerStore } from '@/stores/playerStore'
import { useTranslation } from 'react-i18next'
import Tooltip from './Tooltip'
import { formatTime } from '@/lib/utils'
import { useRef } from 'react'
import type { Track } from '@/lib/types'

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
      <div className="md:hidden fixed inset-0 z-[60] bg-black/50" onClick={toggleQueue} />

      <div className="fixed top-0 right-0 z-[61] w-full md:w-80 h-full bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col md:bottom-20 md:h-auto" style={{ maxHeight: 'calc(100vh - 5rem)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--text)]">{t('queue.title')}</h2>
          <div className="flex items-center gap-2">
            <Tooltip text={t('queue.clearTooltip')}>
              <button onClick={clearQueue} className="text-xs text-[var(--text-dim)] hover:text-[var(--text)] transition px-2 py-1 rounded hover:bg-[var(--surface-hover)]">{t('queue.clear')}</button>
            </Tooltip>
            <Tooltip text={t('queue.close')}>
              <button onClick={toggleQueue} className="text-[var(--text-dim)] hover:text-[var(--text)] text-xl leading-none">✕</button>
            </Tooltip>
          </div>
        </div>

        {queueSource && (
          <div className="px-4 py-2 text-xs text-[var(--text-dim)] border-b border-[var(--border)]">
            {t('queue.source')} {queueSource}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* Now Playing */}
          {currentTrack && (
            <div className="px-4 pt-3 pb-1">
              <p className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider mb-2">{t('queue.nowPlaying')}</p>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30">
                <div className="w-10 h-10 rounded overflow-hidden bg-[var(--surface-hover)] shrink-0">
                  {currentTrack.cover_path ? (
                    <img src={currentTrack.cover_path} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">🎵</div>
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
              <p className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider mb-2">{t('queue.next', { count: queue.length })}</p>
              <div className="space-y-1">
                {queue.map((track, idx) => (
                  <div key={`${track.id}-${idx}`}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={handleDrop}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--surface-hover)] group transition cursor-grab active:cursor-grabbing"
                  >
                    <Tooltip text={t('queue.dragTooltip')}>
                      <span className="text-[var(--text-dim)] text-sm cursor-grab">≡</span>
                    </Tooltip>
                    <div className="w-8 h-8 rounded overflow-hidden bg-[var(--surface-hover)] shrink-0">
                      {track.cover_path ? (
                        <img src={track.cover_path} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">🎵</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--text)] truncate">{track.title}</p>
                      <a href={`/browse?artist=${encodeURIComponent(track.artist)}`} className="text-xs text-[var(--text-dim)] truncate hover:text-[var(--accent)] hover:underline transition block">{track.artist}</a>
                    </div>
                    <span className="text-xs text-[var(--text-dim)]">{formatTime(track.duration_seconds)}</span>
                    <div className="flex md:hidden md:group-hover:flex items-center gap-1">
                      <Tooltip text={t('queue.playTooltip')}>
                        <button onClick={() => play(track)} className="text-xs hover:text-[var(--accent)] transition">▶</button>
                      </Tooltip>
                      <Tooltip text={t('queue.removeTooltip')}>
                        <button onClick={() => removeFromQueue(idx)} className="text-xs hover:text-red-400 transition">✕</button>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {queue.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-dim)]">
              {t('queue.empty')}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

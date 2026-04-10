import { usePlayerStore } from '@/stores/playerStore'
import Tooltip from './Tooltip'
import { formatTime } from '@/lib/utils'
import { useRef } from 'react'
import type { Track } from '@/lib/types'

export default function QueuePanel() {
  const { showQueue, toggleQueue, currentTrack, queue, queueSource, clearQueue, removeFromQueue, reorderQueue, play } = usePlayerStore()
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

      <div className="fixed top-0 right-0 z-[61] w-full md:w-80 h-full bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col md:top-0 md:bottom-20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--text)]">Очередь</h2>
          <div className="flex items-center gap-2">
            <Tooltip text="Очистить очередь">
              <button onClick={clearQueue} className="text-xs text-[var(--text-dim)] hover:text-[var(--text)] transition px-2 py-1 rounded hover:bg-[var(--surface-hover)]">Очистить</button>
            </Tooltip>
            <Tooltip text="Закрыть">
              <button onClick={toggleQueue} className="text-[var(--text-dim)] hover:text-[var(--text)] text-xl leading-none">✕</button>
            </Tooltip>
          </div>
        </div>

        {queueSource && (
          <div className="px-4 py-2 text-xs text-[var(--text-dim)] border-b border-[var(--border)]">
            Источник: {queueSource}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* Now Playing */}
          {currentTrack && (
            <div className="px-4 pt-3 pb-1">
              <p className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider mb-2">Сейчас играет</p>
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
                  <p className="text-xs text-[var(--text-dim)] truncate">{currentTrack.artist}</p>
                </div>
                <span className="text-xs text-[var(--text-dim)]">{formatTime(currentTrack.duration_seconds)}</span>
              </div>
            </div>
          )}

          {/* Up Next */}
          {queue.length > 0 && (
            <div className="px-4 pt-3 pb-20 md:pb-4">
              <p className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider mb-2">Далее ({queue.length})</p>
              <div className="space-y-1">
                {queue.map((track, idx) => (
                  <div key={`${track.id}-${idx}`}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={handleDrop}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--surface-hover)] group transition cursor-grab active:cursor-grabbing"
                  >
                    <Tooltip text="Перетащить для изменения порядка">
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
                      <p className="text-xs text-[var(--text-dim)] truncate">{track.artist}</p>
                    </div>
                    <span className="text-xs text-[var(--text-dim)]">{formatTime(track.duration_seconds)}</span>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <Tooltip text="Воспроизвести">
                        <button onClick={() => play(track)} className="text-xs hover:text-[var(--accent)] transition">▶</button>
                      </Tooltip>
                      <Tooltip text="Убрать из очереди">
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
              Очередь пуста
            </div>
          )}
        </div>
      </div>
    </>
  )
}

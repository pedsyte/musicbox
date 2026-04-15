import { usePlayerStore } from '@/stores/playerStore'
import { useTranslation } from 'react-i18next'
import { formatTime } from '@/lib/utils'
import { useRef, useCallback } from 'react'
import DownloadMenu from './DownloadMenu'
import { Link } from 'react-router-dom'

export default function MobilePlayer() {
  const {
    currentTrack, isPlaying, currentTime, duration, volume,
    repeat, shuffle, showMobilePlayer,
    togglePlay, next, prev, seek, setVolume,
    toggleRepeat, toggleShuffle, toggleQueue,
    setShowMobilePlayer,
  } = usePlayerStore()
  const { t } = useTranslation()
  const progressRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)

  const handleProgressTouch = useCallback((e: React.TouchEvent) => {
    const rect = progressRef.current?.getBoundingClientRect()
    if (!rect || duration <= 0) return
    const touch = e.touches[0] || e.changedTouches[0]
    const pct = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width))
    seek(pct * duration)
  }, [duration, seek])

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    const rect = progressRef.current?.getBoundingClientRect()
    if (!rect || duration <= 0) return
    const pct = (e.clientX - rect.left) / rect.width
    seek(pct * duration)
  }, [duration, seek])

  if (!currentTrack || !showMobilePlayer) return null

  const repeatIcons: Record<string, string> = { off: '↻', all: '🔁', one: '🔂' }
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="md:hidden fixed inset-0 z-[70] bg-[var(--bg)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button onClick={() => setShowMobilePlayer(false)} className="text-[var(--text-dim)] text-2xl p-1">‹</button>
        <span className="text-xs text-[var(--text-dim)] uppercase tracking-wider">{t('player.nowPlaying')}</span>
        <button onClick={() => { toggleQueue(); setShowMobilePlayer(false) }} className="text-[var(--text-dim)] text-lg p-1">📋</button>
      </div>

      {/* Cover */}
      <div className="flex-1 flex items-center justify-center px-8 min-h-0">
        <Link to={`/track/${currentTrack.slug}`} onClick={() => setShowMobilePlayer(false)}
          className="w-full aspect-square max-w-[320px] rounded-2xl overflow-hidden bg-[var(--surface)] shadow-2xl">
          {currentTrack.cover_path ? (
            <img src={currentTrack.cover_path} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-purple-600/30 to-fuchsia-600/30">🎵</div>
          )}
        </Link>
      </div>

      {/* Track info */}
      <div className="px-6 pt-4 pb-2 shrink-0">
        <Link to={`/track/${currentTrack.slug}`} onClick={() => setShowMobilePlayer(false)}
          className="text-lg font-bold text-[var(--text)] truncate block hover:underline">{currentTrack.title}</Link>
        <Link to={`/browse?artist=${encodeURIComponent(currentTrack.artist)}`} onClick={() => setShowMobilePlayer(false)}
          className="text-sm text-[var(--text-dim)] truncate block hover:underline">{currentTrack.artist}</Link>
      </div>

      {/* Progress */}
      <div className="px-6 py-2 shrink-0">
        <div ref={progressRef}
          className="h-2 rounded-full bg-[var(--surface-hover)] cursor-pointer relative"
          onClick={handleProgressClick}
          onTouchStart={handleProgressTouch}
          onTouchMove={handleProgressTouch}>
          <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-150 relative"
            style={{ width: `${pct}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--accent)] shadow-lg" />
          </div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-[var(--text-dim)]">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main controls */}
      <div className="flex items-center justify-center gap-6 py-3 shrink-0">
        <button onClick={toggleShuffle} className={`p-2 text-lg transition ${shuffle ? 'text-[var(--accent)]' : 'text-[var(--text-dim)]'}`}>🔀</button>
        <button onClick={prev} className="p-2 text-2xl text-[var(--text)] active:scale-90 transition">⏮</button>
        <button onClick={togglePlay}
          className="w-16 h-16 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-3xl shadow-lg active:scale-95 transition">
          {isPlaying ? '⏸' : <span className="pl-1">▶</span>}
        </button>
        <button onClick={next} className="p-2 text-2xl text-[var(--text)] active:scale-90 transition">⏭</button>
        <button onClick={toggleRepeat} className={`p-2 text-lg transition ${repeat !== 'off' ? 'text-[var(--accent)]' : 'text-[var(--text-dim)]'}`}>
          {repeatIcons[repeat]}
        </button>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between px-6 pb-6 pt-1 shrink-0" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        {/* Volume */}
        <div className="flex items-center gap-1.5 flex-1">
          <span className="text-sm">{volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</span>
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))}
            className="w-24 h-1 accent-[var(--accent)]" />
        </div>

        {/* Download */}
        <DownloadMenu trackId={currentTrack.id} originalFormat={currentTrack.original_format || 'wav'} compact />
      </div>
    </div>
  )
}

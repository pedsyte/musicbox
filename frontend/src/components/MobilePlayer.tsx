import { usePlayerStore } from '@/stores/playerStore'
import { useTranslation } from 'react-i18next'
import { formatTime } from '@/lib/utils'
import { useRef, useCallback } from 'react'
import DownloadMenu from './DownloadMenu'
import { Link } from 'react-router-dom'
import { ChevronDown, Download, ListMusic, Music2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react'

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

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <div className="md:hidden fixed inset-0 z-[70] bg-[var(--bg)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button onClick={() => setShowMobilePlayer(false)} className="studio-icon-button h-10 w-10"><ChevronDown size={20} /></button>
        <span className="text-xs text-[var(--text-dim)] uppercase tracking-wider">{t('player.nowPlaying')}</span>
        <button onClick={() => { toggleQueue(); setShowMobilePlayer(false) }} className="studio-icon-button h-10 w-10"><ListMusic size={18} /></button>
      </div>

      {/* Cover */}
      <div className="flex-1 flex items-center justify-center px-8 min-h-0">
        <Link to={`/track/${currentTrack.slug}`} onClick={() => setShowMobilePlayer(false)}
          className="w-full aspect-square max-w-[340px] rounded-[2rem] overflow-hidden bg-[var(--surface)] studio-cover-glow">
          {currentTrack.cover_path ? (
            <img src={currentTrack.cover_path} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[linear-gradient(135deg,var(--accent),var(--accent-3))]"><Music2 size={64} className="text-white/90" /></div>
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
          className="h-2 rounded-full bg-[var(--waveform-dim)] cursor-pointer relative overflow-hidden"
          onClick={handleProgressClick}
          onTouchStart={handleProgressTouch}
          onTouchMove={handleProgressTouch}>
          <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-2))] transition-[width] duration-150 relative"
            style={{ width: `${pct}%` }}>
            <div className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-lg" />
          </div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-[var(--text-dim)]">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main controls */}
      <div className="flex items-center justify-center gap-6 py-3 shrink-0">
        <button onClick={toggleShuffle} className={`studio-icon-button h-11 w-11 ${shuffle ? 'active text-[var(--accent)]' : ''}`}><Shuffle size={19} /></button>
        <button onClick={prev} className="studio-icon-button h-12 w-12 active:scale-90"><SkipBack size={22} /></button>
        <button onClick={togglePlay}
          className="h-[4.25rem] w-[4.25rem] rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] text-[#061018] flex items-center justify-center shadow-[0_0_40px_color-mix(in_srgb,var(--accent)_35%,transparent)] active:scale-95 transition">
          {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
        </button>
        <button onClick={next} className="studio-icon-button h-12 w-12 active:scale-90"><SkipForward size={22} /></button>
        <button onClick={toggleRepeat} className={`p-2 text-lg transition ${repeat !== 'off' ? 'text-[var(--accent)]' : 'text-[var(--text-dim)]'}`}>
          {repeat === 'one' ? <Repeat1 size={19} /> : <Repeat size={19} />}
        </button>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between px-6 pb-6 pt-1 shrink-0" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        {/* Volume */}
        <div className="flex items-center gap-1.5 flex-1">
          <VolumeIcon size={18} className="text-[var(--text-dim)]" />
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))}
            className="w-24 h-1 accent-[var(--accent)]" />
        </div>

        {/* Download */}
        <span className="inline-flex items-center gap-2">
          <Download size={16} className="text-[var(--text-dim)]" />
          <DownloadMenu trackId={currentTrack.id} originalFormat={currentTrack.original_format || 'wav'} compact />
        </span>
      </div>
    </div>
  )
}

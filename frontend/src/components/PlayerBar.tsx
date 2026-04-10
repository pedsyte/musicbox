import { useRef, useEffect, useCallback, useState } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { useAuthStore } from '@/stores/authStore'
import { formatTime } from '@/lib/utils'
import Tooltip from './Tooltip'
import Waveform from './Waveform'
import api from '@/lib/api'

export default function PlayerBar() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const {
    currentTrack, isPlaying, currentTime, duration, volume, repeat, shuffle,
    pause, resume, togglePlay, next, prev, seek, setVolume, setCurrentTime, setDuration,
    toggleRepeat, toggleShuffle, toggleQueue, onTrackEnd, setShowMobilePlayer, showQueue,
  } = usePlayerStore()
  const user = useAuthStore(s => s.user)
  const showWaveform = user?.show_waveform ?? true
  const [peaks, setPeaks] = useState<number[]>([])
  const [dragging, setDragging] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  // Load audio when track changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    audio.src = `/api/tracks/${currentTrack.id}/stream`
    audio.load()
    if (isPlaying) audio.play().catch(() => {})
  }, [currentTrack?.id])

  // Play/pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    if (isPlaying) audio.play().catch(() => {})
    else audio.pause()
  }, [isPlaying])

  // Volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // Seek
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack || dragging) return
    if (Math.abs(audio.currentTime - currentTime) > 1) {
      audio.currentTime = currentTime
    }
  }, [currentTime])

  // Time update
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => { if (!dragging) setCurrentTime(audio.currentTime) }
    const onDur = () => setDuration(audio.duration || 0)
    const onEnd = () => onTrackEnd()
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onDur)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onDur)
      audio.removeEventListener('ended', onEnd)
    }
  }, [onTrackEnd, dragging])

  // Load waveform peaks
  useEffect(() => {
    if (!currentTrack) { setPeaks([]); return }
    api.get(`/api/tracks/${currentTrack.id}/waveform`).then(r => setPeaks(r.data.peaks || [])).catch(() => setPeaks([]))
  }, [currentTrack?.id])

  // MediaSession API
  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      artwork: currentTrack.cover_path ? [{ src: currentTrack.cover_path, sizes: '256x256' }] : [],
    })
    navigator.mediaSession.setActionHandler('play', resume)
    navigator.mediaSession.setActionHandler('pause', pause)
    navigator.mediaSession.setActionHandler('nexttrack', next)
    navigator.mediaSession.setActionHandler('previoustrack', prev)
  }, [currentTrack])

  const handleProgressClick = (e: React.MouseEvent) => {
    const rect = progressRef.current?.getBoundingClientRect()
    if (!rect || duration <= 0) return
    const pct = (e.clientX - rect.left) / rect.width
    seek(pct * duration)
  }

  const handleSeek = useCallback((time: number) => { seek(time) }, [seek])

  if (!currentTrack) return <audio ref={audioRef} preload="auto" />

  const repeatIcons: Record<string, string> = { off: '↻', all: '🔁', one: '🔂' }
  const repeatLabels: Record<string, string> = { off: 'Повтор выключен', all: 'Повторять очередь', one: 'Повторять трек' }

  return (
    <>
      <audio ref={audioRef} preload="auto" />

      {/* Desktop Player */}
      <div className="hidden md:flex fixed bottom-0 left-0 right-0 z-50 h-20 bg-[var(--surface)] border-t border-[var(--border)] items-center px-4 gap-4">
        {/* Track info */}
        <div className="flex items-center gap-3 w-64 min-w-0 shrink-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--surface-hover)] shrink-0">
            {currentTrack.cover_path ? (
              <img src={currentTrack.cover_path} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🎵</div>
            )}
          </div>
          <div className="min-w-0">
            <Tooltip text={currentTrack.title}>
              <p className="text-sm font-medium text-[var(--text)] truncate">{currentTrack.title}</p>
            </Tooltip>
            <p className="text-xs text-[var(--text-dim)] truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Controls + Progress */}
        <div className="flex-1 flex flex-col items-center gap-1 max-w-2xl">
          <div className="flex items-center gap-3">
            <Tooltip text={shuffle ? 'Перемешивание включено' : 'Перемешать'}>
              <button onClick={toggleShuffle} className={`p-1 text-sm transition ${shuffle ? 'text-[var(--accent)]' : 'text-[var(--text-dim)] hover:text-[var(--text)]'}`}>🔀</button>
            </Tooltip>
            <Tooltip text="Предыдущий трек">
              <button onClick={prev} className="p-1 text-lg text-[var(--text-dim)] hover:text-[var(--text)] transition">⏮</button>
            </Tooltip>
            <Tooltip text={isPlaying ? 'Пауза' : 'Воспроизвести'}>
              <button onClick={togglePlay} className="w-9 h-9 rounded-full bg-[var(--text)] text-[var(--bg)] flex items-center justify-center text-lg hover:scale-105 transition">
                {isPlaying ? '⏸' : '▶'}
              </button>
            </Tooltip>
            <Tooltip text="Следующий трек">
              <button onClick={next} className="p-1 text-lg text-[var(--text-dim)] hover:text-[var(--text)] transition">⏭</button>
            </Tooltip>
            <Tooltip text={repeatLabels[repeat]}>
              <button onClick={toggleRepeat} className={`p-1 text-sm transition ${repeat !== 'off' ? 'text-[var(--accent)]' : 'text-[var(--text-dim)] hover:text-[var(--text)]'}`}>
                {repeatIcons[repeat]}
              </button>
            </Tooltip>
          </div>

          <div className="w-full flex items-center gap-2 text-xs text-[var(--text-dim)]">
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <div className="flex-1">
              {showWaveform && peaks.length > 0 ? (
                <Waveform peaks={peaks} currentTime={currentTime} duration={duration} onSeek={handleSeek} height={32} />
              ) : (
                <div ref={progressRef} className="h-1.5 rounded-full bg-[var(--surface-hover)] cursor-pointer group relative" onClick={handleProgressClick}>
                  <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
                </div>
              )}
            </div>
            <span className="w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 w-48 justify-end shrink-0">
          <Tooltip text={`Громкость: ${Math.round(volume * 100)}%`}>
            <div className="flex items-center gap-1">
              <span className="text-sm">{volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</span>
              <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 accent-[var(--accent)]" />
            </div>
          </Tooltip>
          <Tooltip text="Очередь воспроизведения">
            <button onClick={toggleQueue} className={`p-1 text-sm transition ${showQueue ? 'text-[var(--accent)]' : 'text-[var(--text-dim)] hover:text-[var(--text)]'}`}>📋</button>
          </Tooltip>
          <Tooltip text="Скачать">
            <a href={`/api/tracks/${currentTrack.id}/download?format=mp3`} className="p-1 text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition">⬇</a>
          </Tooltip>
        </div>
      </div>

      {/* Mobile Player - compact bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-50 bg-[var(--surface)] border-t border-[var(--border)]"
        onClick={() => setShowMobilePlayer(true)}>
        <div className="h-0.5 bg-[var(--surface-hover)]">
          <div className="h-full bg-[var(--accent)]" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
        </div>
        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded overflow-hidden bg-[var(--surface-hover)] shrink-0">
            {currentTrack.cover_path ? (
              <img src={currentTrack.cover_path} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg">🎵</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text)] truncate">{currentTrack.title}</p>
            <p className="text-xs text-[var(--text-dim)] truncate">{currentTrack.artist}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); togglePlay() }} className="p-2 text-xl">{isPlaying ? '⏸' : '▶'}</button>
          <button onClick={(e) => { e.stopPropagation(); next() }} className="p-2 text-lg">⏭</button>
        </div>
      </div>
    </>
  )
}

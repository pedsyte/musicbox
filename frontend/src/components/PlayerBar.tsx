import { useRef, useEffect, useCallback, useState } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from 'react-i18next'
import { formatTime } from '@/lib/utils'
import Tooltip from './Tooltip'
import Waveform from './Waveform'
import DownloadMenu from './DownloadMenu'
import api from '@/lib/api'
import { ListMusic, Music2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react'

export default function PlayerBar() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const {
    currentTrack, isPlaying, currentTime, duration, volume, repeat, shuffle,
    pause, resume, togglePlay, next, prev, seek, setVolume, setCurrentTime, setDuration,
    toggleRepeat, toggleShuffle, toggleQueue, onTrackEnd, setShowMobilePlayer, showQueue,
    streamQuality, setStreamQuality,
  } = usePlayerStore()
  const user = useAuthStore(s => s.user)
  const showWaveform = user?.show_waveform ?? true
  const { t } = useTranslation()
  const [peaks, setPeaks] = useState<number[]>([])
  const [dragging, setDragging] = useState(false)
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const qualityRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  // Close quality menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (qualityRef.current && !qualityRef.current.contains(e.target as Node)) {
        setShowQualityMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load audio when track or quality changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    const qualityParam = streamQuality !== 'original' ? `?quality=${streamQuality}` : ''
    audio.src = `/api/tracks/${currentTrack.id}/stream${qualityParam}`
    audio.load()
    if (isPlaying) audio.play().catch(() => {})
  }, [currentTrack?.id, streamQuality])

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

  const repeatLabels: Record<string, string> = { off: t('player.repeatOff'), all: t('player.repeatQueue'), one: t('player.repeatTrack') }
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <>
      <audio ref={audioRef} preload="auto" />

      {/* Desktop Player */}
      <div className="hidden md:flex fixed bottom-0 left-0 right-0 z-50 h-[5.5rem] border-t border-[var(--border)] bg-[var(--player-bg)] items-center justify-center px-4 gap-4 backdrop-blur-2xl">
        {/* Track info */}
        <div className="flex items-center gap-3 w-64 min-w-0 shrink-0">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[var(--surface-hover)] shrink-0 studio-cover-glow">
            {currentTrack.cover_path ? (
              <img src={currentTrack.cover_path} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[linear-gradient(135deg,var(--accent),var(--accent-3))]"><MusicFallback /></div>
            )}
          </div>
          <div className="min-w-0">
            <Tooltip text={currentTrack.title}>
              <p className="text-sm font-medium text-[var(--text)] truncate">{currentTrack.title}</p>
            </Tooltip>
            <a href={`/browse?artist=${encodeURIComponent(currentTrack.artist)}`} className="text-xs text-[var(--text-dim)] truncate hover:text-[var(--accent)] hover:underline transition block">{currentTrack.artist}</a>
          </div>
        </div>

        {/* Controls + Progress */}
        <div className="flex-1 flex flex-col items-center gap-1 max-w-2xl">
          <div className="flex items-center gap-3">
            <Tooltip text={shuffle ? t('player.shuffleOn') : t('player.shuffle')}>
              <button onClick={toggleShuffle} className={`studio-icon-button h-8 w-8 ${shuffle ? 'active text-[var(--accent)]' : ''}`}><Shuffle size={16} /></button>
            </Tooltip>
            <Tooltip text={t('player.prevTrack')}>
              <button onClick={prev} className="studio-icon-button h-8 w-8"><SkipBack size={17} /></button>
            </Tooltip>
            <Tooltip text={isPlaying ? t('player.pause') : t('player.play')}>
              <button onClick={togglePlay} className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] text-[#061018] shadow-[0_0_28px_color-mix(in_srgb,var(--accent)_34%,transparent)] transition hover:scale-105">
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
              </button>
            </Tooltip>
            <Tooltip text={t('player.nextTrack')}>
              <button onClick={next} className="studio-icon-button h-8 w-8"><SkipForward size={17} /></button>
            </Tooltip>
            <Tooltip text={repeatLabels[repeat]}>
              <button onClick={toggleRepeat} className={`studio-icon-button h-8 w-8 ${repeat !== 'off' ? 'active text-[var(--accent)]' : ''}`}>
                {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
              </button>
            </Tooltip>
          </div>

          <div className="w-full flex items-center gap-2 text-xs text-[var(--text-dim)]">
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <div className="flex-1">
              {showWaveform && peaks.length > 0 ? (
                <Waveform peaks={peaks} currentTime={currentTime} duration={duration} onSeek={handleSeek} height={32} />
              ) : (
                <div ref={progressRef} className="h-1.5 rounded-full bg-[var(--waveform-dim)] cursor-pointer group relative overflow-hidden" onClick={handleProgressClick}>
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-2))] transition-all" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
                </div>
              )}
            </div>
            <span className="w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 w-48 justify-end shrink-0 self-end mb-3">
          {/* Stream quality selector */}
          <div ref={qualityRef} className="relative">
            <Tooltip text={t('player.qualityPlayback')}>
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded border transition ${
                  streamQuality !== 'original'
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-[var(--text-dim)] text-[var(--text-dim)] hover:text-[var(--text)] hover:border-[var(--text)]'
                }`}
              >
                {streamQuality === 'original' ? (currentTrack.original_format || 'WAV').toUpperCase() : streamQuality.toUpperCase()}
              </button>
            </Tooltip>
            {showQualityMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl py-1 min-w-[140px] z-50">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[var(--text-dim)] font-semibold">{t('player.quality')}</div>
                {(() => {
                  const orig = (currentTrack.original_format || 'wav').toLowerCase()
                  // Quality tiers: only show formats strictly below original
                  // wav/flac are both lossless (tier 3), mp3 is lossy (tier 1)
                  const qualityOrder: Record<string, number> = { mp3: 1, ogg: 1, flac: 3, wav: 3 }
                  const origTier = qualityOrder[orig] || 3
                  const options = ['original', ...(['flac', 'mp3'].filter(f =>
                    f !== orig && (qualityOrder[f] || 0) < origTier
                  ))]
                  return options.map(q => (
                    <button
                      key={q}
                      onClick={() => { setStreamQuality(q); setShowQualityMenu(false) }}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--surface-hover)] transition flex items-center justify-between ${
                        streamQuality === q ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                      }`}
                    >
                      <span>{q === 'original' ? t('player.originalFormat', { format: orig.toUpperCase() }) : q.toUpperCase()}</span>
                      {streamQuality === q && <span className="text-xs">✓</span>}
                    </button>
                  ))
                })()}
              </div>
            )}
          </div>
          <Tooltip text={t('player.volume', { value: Math.round(volume * 100) })}>
            <div className="flex items-center gap-1">
              <VolumeIcon size={17} className="text-[var(--text-dim)]" />
              <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 accent-[var(--accent)]" />
            </div>
          </Tooltip>
          <Tooltip text={t('player.queue')}>
            <button onClick={toggleQueue} className={`studio-icon-button h-8 w-8 ${showQueue ? 'active text-[var(--accent)]' : ''}`}><ListMusic size={16} /></button>
          </Tooltip>
          <Tooltip text={t('player.download')}>
            <DownloadMenu trackId={currentTrack.id} originalFormat={currentTrack.original_format || 'wav'} compact className="h-8 w-8" />
          </Tooltip>
        </div>
      </div>

      {/* Mobile Player - compact bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--player-bg)] backdrop-blur-2xl">
        <div className="h-0.5 bg-[var(--waveform-dim)]">
          <div className="h-full bg-[linear-gradient(90deg,var(--accent),var(--accent-2))]" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
        </div>
        <div className="flex items-center gap-2 p-2">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-[var(--surface-hover)] shrink-0"
            onClick={() => setShowMobilePlayer(true)}>
            {currentTrack.cover_path ? (
              <img src={currentTrack.cover_path} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[linear-gradient(135deg,var(--accent),var(--accent-3))]"><MusicFallback small /></div>
            )}
          </div>
          <div className="flex-1 min-w-0" onClick={() => setShowMobilePlayer(true)}>
            <p className="text-sm font-medium text-[var(--text)] truncate">{currentTrack.title}</p>
            <a href={`/browse?artist=${encodeURIComponent(currentTrack.artist)}`}
              onClick={e => e.stopPropagation()}
              className="text-xs text-[var(--text-dim)] truncate block hover:text-[var(--accent)]">{currentTrack.artist}</a>
          </div>
          <button onClick={(e) => { e.stopPropagation(); prev() }} className="studio-icon-button h-9 w-9"><SkipBack size={17} /></button>
          <button onClick={(e) => { e.stopPropagation(); togglePlay() }} className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--text)] text-[var(--bg)]">{isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" className="ml-0.5" />}</button>
          <button onClick={(e) => { e.stopPropagation(); next() }} className="studio-icon-button h-9 w-9"><SkipForward size={17} /></button>
          <button onClick={(e) => { e.stopPropagation(); toggleQueue() }} className="studio-icon-button h-9 w-9"><ListMusic size={16} /></button>
        </div>
      </div>
    </>
  )
}

function MusicFallback({ small = false }: { small?: boolean }) {
  return <Music2 className="text-white/90" size={small ? 18 : 24} />
}

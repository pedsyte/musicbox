import type { Track } from '@/lib/types'
import { usePlayerStore } from '@/stores/playerStore'
import { useAuthStore } from '@/stores/authStore'
import Tooltip from './Tooltip'
import DownloadMenu from './DownloadMenu'
import { formatTime } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { api } from '@/lib/api'
import { Link } from 'react-router-dom'

interface Props {
  track: Track
  tracks?: Track[]
  idx?: number
  showArtist?: boolean
  showCover?: boolean
  compact?: boolean
}

export default function TrackCard({ track, tracks, idx, showArtist = true, showCover = true, compact = false }: Props) {
  const { play, currentTrack, isPlaying, playNext, addToQueue } = usePlayerStore()
  const { user } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isFav, setIsFav] = useState(track.is_favorite ?? false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isCurrent = currentTrack?.id === track.id

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handlePlay = () => {
    if (tracks) {
      const queue = [...tracks]
      usePlayerStore.getState().setQueue(queue, idx ?? 0)
    }
    play(track)
  }

  const toggleFav = async () => {
    if (!user) return
    try {
      if (isFav) {
        await api.delete(`/api/favorites/${track.id}`)
      } else {
        await api.post(`/api/favorites/${track.id}`)
      }
      setIsFav(!isFav)
    } catch {}
  }

  return (
    <div className={`group flex items-center gap-3 rounded-lg transition cursor-pointer ${compact ? 'p-1.5 hover:bg-[var(--surface-hover)]' : 'p-2.5 hover:bg-[var(--surface-hover)]'} ${isCurrent ? 'bg-[var(--accent)]/10' : ''}`}>
      {/* Index / play btn */}
      <div className="w-8 text-center shrink-0">
        <span className={`group-hover:hidden text-sm ${isCurrent ? 'text-[var(--accent)]' : 'text-[var(--text-dim)]'}`}>
          {isCurrent && isPlaying ? '♫' : idx !== undefined ? idx + 1 : '♪'}
        </span>
        <button onClick={handlePlay} className="hidden group-hover:block text-sm text-[var(--text)] hover:text-[var(--accent)] transition mx-auto">▶</button>
      </div>

      {/* Cover */}
      {showCover && (
        <Link to={`/track/${track.id}`} className="w-10 h-10 rounded overflow-hidden bg-[var(--surface-hover)] shrink-0">
          {track.cover_path ? (
            <img src={track.cover_path} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">🎵</div>
          )}
        </Link>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <Link to={`/track/${track.id}`} className={`block text-sm font-medium truncate ${isCurrent ? 'text-[var(--accent)]' : 'text-[var(--text)]'} hover:underline`}>{track.title}</Link>
        {showArtist && <Link to={`/browse?artist=${encodeURIComponent(track.artist)}`} className="block text-xs text-[var(--text-dim)] truncate hover:text-[var(--accent)] hover:underline transition">{track.artist}</Link>}
      </div>

      {/* Genre pills */}
      {!compact && track.genres && track.genres.length > 0 && (
        <div className="hidden md:flex gap-1 shrink-0 flex-wrap">
          {track.genres.map(g => (
            <span key={g.id} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-dim)]">{g.name}</span>
          ))}
        </div>
      )}

      {/* Duration */}
      <span className="text-xs text-[var(--text-dim)] shrink-0 w-10 text-right">{formatTime(track.duration_seconds)}</span>

      {/* Fav */}
      {user && (
        <Tooltip text={isFav ? 'Убрать из избранного' : 'В избранное'}>
          <button onClick={toggleFav} className={`text-sm transition ${isFav ? 'text-red-400' : 'text-[var(--text-dim)] opacity-0 group-hover:opacity-100'} hover:scale-110`}>
            {isFav ? '❤️' : '🤍'}
          </button>
        </Tooltip>
      )}

      {/* Context menu */}
      <div className="relative" ref={menuRef}>
        <Tooltip text="Ещё">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-[var(--text-dim)] opacity-0 group-hover:opacity-100 hover:text-[var(--text)] transition text-sm px-1">⋯</button>
        </Tooltip>
        {menuOpen && (
          <div className="absolute right-0 top-8 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl z-50 py-1 overflow-hidden">
            <button onClick={() => { playNext(track); setMenuOpen(false) }} className="w-full text-left px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-hover)] transition">Играть следующим</button>
            <button onClick={() => { addToQueue(track); setMenuOpen(false) }} className="w-full text-left px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-hover)] transition">Добавить в очередь</button>
            <Link to={`/track/${track.id}`} onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-hover)] transition">Страница трека</Link>
            <DownloadMenu trackId={track.id} originalFormat={track.original_format || 'wav'} onClose={() => setMenuOpen(false)} />
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { Download, Loader2 } from 'lucide-react'

interface Props {
  trackId: string
  originalFormat: string
  className?: string
  compact?: boolean
  onClose?: () => void
}

export default function DownloadMenu({ trackId, originalFormat, className = '', compact = false, onClose }: Props) {
  const { t } = useTranslation()
  const FORMAT_LABELS: Record<string, string> = {
    wav: t('download.wav'),
    flac: t('download.flac'),
    mp3: t('download.mp3'),
    ogg: t('download.ogg'),
  }
  const [formats, setFormats] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadFormats = async () => {
    if (formats.length > 0) { setOpen(!open); return }
    setLoading(true)
    try {
      const res = await api.get(`/api/tracks/${trackId}/formats`)
      setFormats(res.data.formats)
      setOpen(true)
    } catch {
      // fallback
      setFormats([originalFormat, 'mp3'].filter((v, i, a) => a.indexOf(v) === i))
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`relative ${compact ? className : ''}`} ref={ref}>
      <button
        onClick={loadFormats}
        className={compact
          ? `studio-icon-button h-10 w-10 ${className}`
          : `w-full text-left px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-hover)] transition inline-flex items-center gap-2 ${className}`}
        title={t('download.title')}
        aria-label={t('download.title')}
      >
        {loading ? <Loader2 size={compact ? 16 : 15} className="animate-spin" /> : (
          <>
            <Download size={compact ? 16 : 15} />
            {!compact && <span>{t('download.button')}</span>}
          </>
        )}
      </button>
      {open && formats.length > 0 && (
        <div className={`absolute ${compact ? 'right-0 bottom-11' : 'right-0 top-9'} w-56 bg-[var(--player-bg)] border border-[var(--border-strong)] rounded-xl shadow-2xl backdrop-blur-xl z-[60] py-1 overflow-hidden`}>
          <p className="px-3 py-1.5 text-[10px] text-[var(--text-dim)] uppercase tracking-wider">{t('download.formatTitle')}</p>
          {formats.map(fmt => (
            <a
              key={fmt}
              href={`/api/tracks/${trackId}/download?format=${fmt}`}
              className="flex items-center justify-between px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-hover)] transition"
              onClick={() => { setOpen(false); onClose?.() }}
            >
              <span>{FORMAT_LABELS[fmt] || fmt.toUpperCase()}</span>
              {fmt === originalFormat && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)]">{t('download.original')}</span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'

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
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={loadFormats}
        className={compact
          ? 'p-1 text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition'
          : 'w-full text-left px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-hover)] transition'}
        title={t('download.title')}
      >
        {loading ? '...' : compact ? '⬇' : t('download.button')}
      </button>
      {open && formats.length > 0 && (
        <div className={`absolute ${compact ? 'right-0 bottom-8' : 'right-0 top-8'} w-52 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl z-[60] py-1 overflow-hidden`}>
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

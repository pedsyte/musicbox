import { useEffect, useRef } from 'react'

interface Props {
  peaks: number[]
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  height?: number
  barWidth?: number
  gap?: number
}

export default function Waveform({ peaks, currentTime, duration, onSeek, height = 40, barWidth = 3, gap = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const progress = duration > 0 ? currentTime / duration : 0

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || peaks.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Resolve CSS variables — Canvas API doesn't support var() syntax
    const styles = getComputedStyle(container)
    const activeColor = styles.getPropertyValue('--waveform-active').trim() || '#7c3aed'
    const dimColor = styles.getPropertyValue('--waveform-dim').trim() || '#3a3a3a'

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, rect.width, rect.height)

    const totalBars = Math.floor(rect.width / (barWidth + gap))
    const step = peaks.length / totalBars
    const progressX = progress * rect.width

    for (let i = 0; i < totalBars; i++) {
      const peakIdx = Math.floor(i * step)
      const val = peaks[peakIdx] ?? 0
      const barH = Math.max(2, val * (rect.height - 4))
      const x = i * (barWidth + gap)
      const y = (rect.height - barH) / 2

      ctx.fillStyle = x < progressX ? activeColor : dimColor
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barH, 1)
      ctx.fill()
    }
  }, [peaks, progress, barWidth, gap, height])

  const handleClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || duration <= 0) return
    const x = e.clientX - rect.left
    const pct = x / rect.width
    onSeek(pct * duration)
  }

  return (
    <div ref={containerRef} className="w-full cursor-pointer" style={{ height }} onClick={handleClick}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

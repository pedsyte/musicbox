import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface Slide {
  id: string
  eyebrow: string
  title: string
  sub: string
  cta: string
  to: string
  emoji: string
  gradient: string
  glow1: string
  glow2: string
}

export default function PromoSlider() {
  const { t } = useTranslation()
  const [cur, setCur] = useState(0)
  const timerRef = useRef<number | null>(null)
  const touchX = useRef(0)
  const touchD = useRef(0)

  const slides: Slide[] = [
    {
      id: 'new',
      eyebrow: '♫ ' + t('promo.newBadge', { defaultValue: 'Новинки недели' }),
      title: t('promo.newTitle', { defaultValue: 'Свежие треки\nтолько что загружены' }),
      sub: t('promo.newSub', { defaultValue: 'Слушай первыми и добавляй в избранное' }),
      cta: t('promo.newCta', { defaultValue: 'Послушать' }),
      to: '/browse?sort=newest',
      emoji: '✨',
      gradient: 'from-[#7c3aed] via-[#a855f7] to-[#ec4899]',
      glow1: 'rgba(167,139,250,0.55)',
      glow2: 'rgba(236,72,153,0.35)',
    },
    {
      id: 'popular',
      eyebrow: '🔥 ' + t('promo.popularBadge', { defaultValue: 'Чарт недели' }),
      title: t('promo.popularTitle', { defaultValue: 'Самые популярные\nтреки сейчас' }),
      sub: t('promo.popularSub', { defaultValue: 'Следи за тем, что слушают другие' }),
      cta: t('promo.popularCta', { defaultValue: 'Открыть чарт' }),
      to: '/browse?sort=popular',
      emoji: '🏆',
      gradient: 'from-[#f97316] via-[#f43f5e] to-[#ec4899]',
      glow1: 'rgba(249,115,22,0.55)',
      glow2: 'rgba(244,63,94,0.35)',
    },
    {
      id: 'playlists',
      eyebrow: '🎵 ' + t('promo.plBadge', { defaultValue: 'Публичные плейлисты' }),
      title: t('promo.plTitle', { defaultValue: 'Подборки на любое\nнастроение' }),
      sub: t('promo.plSub', { defaultValue: 'Тысячи плейлистов от сообщества' }),
      cta: t('promo.plCta', { defaultValue: 'Исследовать' }),
      to: '/explore',
      emoji: '🎶',
      gradient: 'from-[#10b981] via-[#06b6d4] to-[#3b82f6]',
      glow1: 'rgba(16,185,129,0.55)',
      glow2: 'rgba(59,130,246,0.35)',
    },
    {
      id: 'genres',
      eyebrow: '🎛 ' + t('promo.genBadge', { defaultValue: 'Фильтр по жанрам' }),
      title: t('promo.genTitle', { defaultValue: 'Находи музыку\nпод настроение' }),
      sub: t('promo.genSub', { defaultValue: 'Комбинируй и исключай жанры — один клик' }),
      cta: t('promo.genCta', { defaultValue: 'Попробовать' }),
      to: '/browse',
      emoji: '🎚️',
      gradient: 'from-[#6366f1] via-[#8b5cf6] to-[#d946ef]',
      glow1: 'rgba(99,102,241,0.55)',
      glow2: 'rgba(217,70,239,0.35)',
    },
  ]

  const total = slides.length

  const go = (i: number) => setCur(((i % total) + total) % total)
  const next = () => go(cur + 1)
  const prev = () => go(cur - 1)

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setCur(c => (c + 1) % total)
    }, 5500)
    return () => { if (timerRef.current) window.clearInterval(timerRef.current) }
  }, [total])

  const pause = () => { if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null } }
  const resume = () => {
    if (timerRef.current) return
    timerRef.current = window.setInterval(() => setCur(c => (c + 1) % total), 5500)
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-[var(--border)]"
      style={{ background: 'rgba(15,15,20,0.4)', backdropFilter: 'blur(14px)' }}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; touchD.current = 0; pause() }}
      onTouchMove={(e) => { touchD.current = e.touches[0].clientX - touchX.current }}
      onTouchEnd={() => { if (Math.abs(touchD.current) > 50) { touchD.current < 0 ? next() : prev() } resume() }}
    >
      <div
        className="flex transition-transform duration-700"
        style={{ transform: `translateX(-${cur * 100}%)`, transitionTimingFunction: 'cubic-bezier(0.77,0,0.18,1)' }}
      >
        {slides.map((s) => (
          <Link
            key={s.id}
            to={s.to}
            className={`min-w-full relative flex items-center gap-4 px-6 sm:px-10 py-8 sm:py-10 no-underline bg-gradient-to-br ${s.gradient}`}
            style={{ minHeight: 210 }}
          >
            {/* glow layers */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 85% 50%, ${s.glow1} 0%, transparent 55%), radial-gradient(circle at 15% 30%, ${s.glow2} 0%, transparent 50%)`,
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 100%)' }}
            />
            {/* noise texture */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.08] mix-blend-overlay"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              }}
            />

            <div className="relative z-10 flex-1 min-w-0 max-w-[75%]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm mb-3 text-[0.72rem] font-semibold tracking-widest uppercase text-white">
                {s.eyebrow}
              </div>
              <h3 className="text-white font-bold leading-[1.05] tracking-tight mb-2 text-[clamp(1.25rem,3vw,2.1rem)] whitespace-pre-line drop-shadow-md">
                {s.title}
              </h3>
              <p className="text-white/85 text-sm sm:text-[0.95rem] max-w-md hidden sm:block">
                {s.sub}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/25 backdrop-blur-sm text-white text-sm font-semibold transition-transform group-hover:translate-x-1">
                {s.cta} <span aria-hidden>→</span>
              </div>
            </div>

            <div
              className="relative z-10 text-[4rem] sm:text-[6rem] leading-none select-none drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.35))' }}
            >
              {s.emoji}
            </div>
          </Link>
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={(e) => { e.preventDefault(); pause(); prev(); resume() }}
        className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full items-center justify-center bg-black/40 hover:bg-black/60 text-white border border-white/15 backdrop-blur-md transition z-20"
        aria-label="prev"
      >‹</button>
      <button
        onClick={(e) => { e.preventDefault(); pause(); next(); resume() }}
        className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full items-center justify-center bg-black/40 hover:bg-black/60 text-white border border-white/15 backdrop-blur-md transition z-20"
        aria-label="next"
      >›</button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.preventDefault(); pause(); go(i); resume() }}
            className={`h-1 rounded-full transition-all ${i === cur ? 'bg-white w-10 shadow-lg shadow-white/40' : 'bg-white/35 w-6 hover:bg-white/55'}`}
            aria-label={`slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

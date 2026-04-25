import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'
import {
  CheckCircle2,
  CircleX,
  Disc3,
  Download,
  FolderArchive,
  Heart,
  Headphones,
  ListMusic,
  Pause,
  Pin,
  Play,
  Puzzle,
  Radio,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Tags,
  TrendingUp,
  Upload,
  Wrench,
} from 'lucide-react'

type Feature = {
  Icon: LucideIcon
  title: string
  desc: string
}

type Step = {
  num: string
  title: string
  desc: string
  Icon: LucideIcon
}

export default function Extension() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
  const { t } = useTranslation()

  const features: Feature[] = [
    { Icon: Headphones, title: t('extension.feat_bg'), desc: t('extension.feat_bg_desc') },
    { Icon: ListMusic, title: t('extension.feat_playlists'), desc: t('extension.feat_playlists_desc') },
    { Icon: Tags, title: t('extension.feat_genres'), desc: t('extension.feat_genres_desc') },
    { Icon: TrendingUp, title: t('extension.feat_top'), desc: t('extension.feat_top_desc') },
    { Icon: Heart, title: t('extension.feat_favs'), desc: t('extension.feat_favs_desc') },
    { Icon: Radio, title: t('extension.feat_radio'), desc: t('extension.feat_radio_desc') },
    { Icon: Shuffle, title: t('extension.feat_shuffle'), desc: t('extension.feat_shuffle_desc') },
    { Icon: Search, title: t('extension.feat_search'), desc: t('extension.feat_search_desc') },
  ]

  const steps: Step[] = [
    { num: '1', title: t('extension.step1_title'), desc: t('extension.step1_desc'), Icon: Download },
    { num: '2', title: t('extension.step2_title'), desc: t('extension.step2_desc'), Icon: FolderArchive },
    { num: '3', title: t('extension.step3_title'), desc: t('extension.step3_desc'), Icon: Puzzle },
    { num: '4', title: t('extension.step4_title'), desc: t('extension.step4_desc'), Icon: Wrench },
    { num: '5', title: t('extension.step5_title'), desc: t('extension.step5_desc'), Icon: Upload },
    { num: '6', title: t('extension.step6_title'), desc: t('extension.step6_desc'), Icon: Pin },
  ]

  return (
    <div className="studio-page max-w-6xl mx-auto">
      <section className="studio-panel p-6 md:p-8 overflow-hidden">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] items-center">
          <div className="space-y-5">
            <p className="studio-kicker inline-flex items-center gap-2"><Puzzle size={14} />{t('extension.title')}</p>
            <div>
              <h1 className="studio-title">MusicBox Player</h1>
              <p className="studio-muted mt-3 max-w-2xl">{t('extension.subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a href="/uploads/musicbox-extension.zip" download className="studio-primary-button">
                <Download size={17} />
                {t('extension.downloadBtn')}
              </a>
              <span className="text-xs text-[var(--text-dim)]">v1.0 | 12 KB | Chrome / Edge / Brave</span>
            </div>
          </div>

          <div className="studio-panel-flat p-4">
            <div className="rounded-xl border border-[var(--border)] bg-[#080b13] p-4 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Disc3 size={18} className="text-[var(--accent)]" />
                  <span className="text-sm font-bold">MusicBox</span>
                </div>
                <div className="text-xs text-zinc-500">gornich.fun</div>
              </div>
              <div className="bg-[#0f1724] rounded-lg px-3 py-2 text-xs text-zinc-500 border border-white/5">{t('extension.searchPlaceholder')}</div>
              <div className="flex gap-2 text-xs border-b border-zinc-800 pb-2">
                <span className="text-cyan-300 border-b-2 border-cyan-300 pb-1">{t('extension.all')}</span>
                <span className="text-zinc-500">{t('extension.top')}</span>
                <span className="text-zinc-500">{t('nav.playlists')}</span>
                <span className="text-zinc-500">{t('nav.favorites')}</span>
              </div>
              {[
                { title: 'Midnight Drive', artist: 'MusicBox', duration: '3:24' },
                { title: 'Electric Dreams', artist: 'MusicBox', duration: '2:58' },
                { title: 'Summer Vibes', artist: 'MusicBox', duration: '4:12' },
              ].map((track, i) => (
                <div key={track.title} className={`flex items-center gap-3 rounded-lg border border-white/5 bg-white/[.03] px-2 py-2 ${i === 0 ? 'opacity-100' : 'opacity-55'}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-cyan-400 text-slate-950' : 'bg-zinc-800 text-zinc-500'}`}>
                    {i === 0 ? <Play size={14} fill="currentColor" /> : <Disc3 size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium truncate ${i === 0 ? 'text-cyan-300' : 'text-zinc-300'}`}>{track.title}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{track.artist}</div>
                  </div>
                  <div className="text-[10px] text-zinc-600">{track.duration}</div>
                </div>
              ))}
              <div className="mt-2 pt-3 border-t border-zinc-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[linear-gradient(135deg,#22d3ee,#a3e635)]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white">Midnight Drive</div>
                    <div className="text-[10px] text-zinc-500">MusicBox</div>
                  </div>
                  <div className="flex items-center gap-1 text-zinc-400">
                    <SkipBack size={14} />
                    <span className="w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center text-slate-950"><Pause size={14} fill="currentColor" /></span>
                    <SkipForward size={14} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-zinc-600">1:42</span>
                  <div className="flex-1 h-1 bg-zinc-800 rounded overflow-hidden">
                    <div className="h-full w-1/2 bg-[linear-gradient(90deg,#22d3ee,#a3e635)] rounded" />
                  </div>
                  <span className="text-[9px] text-zinc-600">3:24</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="studio-section-title mb-4">{t('extension.features')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {features.map(({ Icon, title, desc }, i) => (
            <div
              key={title}
              className={`studio-grid-card p-4 cursor-default ${hoveredFeature === i ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10' : ''}`}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--accent)]">
                <Icon size={17} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text)] mb-1">{title}</h3>
              <p className="text-xs text-[var(--text-dim)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="studio-panel-flat p-5">
        <h2 className="studio-section-title mb-2">{t('extension.howToInstall')}</h2>
        <p className="studio-muted mb-5">{t('extension.howToInstallHint')}</p>
        <div className="grid gap-3 md:grid-cols-2">
          {steps.map(({ Icon, ...step }) => (
            <div key={step.num} className="flex gap-4 items-start rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] flex items-center justify-center">
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[var(--accent)]">0{step.num}</span>
                  <h3 className="text-sm font-semibold text-[var(--text)]">{step.title}</h3>
                </div>
                <p className="text-sm text-[var(--text-dim)] mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="studio-panel-flat p-5 text-center space-y-5">
        <h2 className="studio-section-title justify-center">{t('extension.compatibility')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { name: 'Chrome', ok: true },
            { name: 'Edge', ok: true },
            { name: 'Brave', ok: true },
            { name: 'Opera', ok: true },
            { name: 'Firefox', ok: false },
          ].map((browser) => (
            <div key={browser.name} className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 ${browser.ok ? '' : 'opacity-50'}`}>
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-hover)] text-[var(--text-dim)]">
                {browser.ok ? <CheckCircle2 size={17} className="text-[var(--accent-2)]" /> : <CircleX size={17} className="text-[var(--accent-3)]" />}
              </div>
              <p className="text-xs font-medium text-[var(--text)]">{browser.name}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-dim)]">{t('extension.compatibilityHint')}</p>
        <a href="/uploads/musicbox-extension.zip" download className="studio-primary-button mx-auto">
          <Download size={17} />
          {t('extension.downloadFinal')}
        </a>
      </section>
    </div>
  )
}

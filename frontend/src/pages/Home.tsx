import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Track, Genre, Playlist, CollectionGroup } from '@/lib/types'
import TrackCard from '@/components/TrackCard'
import PlaylistCard from '@/components/PlaylistCard'
import CollectionCard from '@/components/CollectionCard'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AudioWaveform, Disc3, Library, Music2, Play, Radio, Sparkles, TrendingUp } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'

type Period = 'day' | 'week' | 'month' | 'all'

export default function Home() {
  const { t } = useTranslation()
  const PERIODS: { value: Period; label: string }[] = [
    { value: 'day', label: t('home.day') },
    { value: 'week', label: t('home.week') },
    { value: 'month', label: t('home.month') },
    { value: 'all', label: t('home.allTime') },
  ]

  const [newTracks, setNewTracks] = useState<Track[]>([])
  const [popular, setPopular] = useState<Track[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [collectionGroups, setCollectionGroups] = useState<CollectionGroup[]>([])
  const [period, setPeriod] = useState<Period>('week')
  const [loading, setLoading] = useState(true)
  const { play } = usePlayerStore()

  useEffect(() => {
    Promise.all([
      api.get('/api/tracks?limit=10&sort=newest'),
      api.get('/api/genres'),
      api.get('/api/playlists/public').catch(() => ({ data: [] })),
      api.get('/api/collections').catch(() => ({ data: [] })),
    ]).then(([tracksRes, genresRes, playlistsRes, collectionsRes]) => {
      setNewTracks(tracksRes.data.tracks)
      setGenres(genresRes.data.filter((g: Genre) => (g.track_count ?? 0) > 0).slice(0, 12))
      setPlaylists(playlistsRes.data.slice(0, 8))
      setCollectionGroups(collectionsRes.data.slice(0, 3))
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    api.get(`/api/tracks/popular?period=${period}&limit=10`)
      .then(res => setPopular(res.data))
      .catch(() => setPopular([]))
  }, [period])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const featured = popular[0] || newTracks[0] || null
  const totalTracks = Math.max(newTracks.length, popular.length)
  const featuredCollections = collectionGroups.flatMap(g => g.collections).slice(0, 6)

  return (
    <div className="studio-page space-y-8">
      {/* Studio hero */}
      <section className="studio-panel relative overflow-hidden p-5 md:p-7">
        <div className="absolute inset-0 pointer-events-none opacity-80" style={{
          background: 'radial-gradient(circle at 75% 20%, color-mix(in srgb, var(--accent) 24%, transparent), transparent 28rem), radial-gradient(circle at 5% 80%, color-mix(in srgb, var(--accent-3) 18%, transparent), transparent 22rem)'
        }} />
        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div className="min-w-0">
            <div className="studio-kicker mb-3 inline-flex items-center gap-2"><Radio size={14} />{t('home.deckKicker', { defaultValue: 'Studio Deck' })}</div>
            <h1 className="studio-title max-w-3xl text-3xl md:text-5xl">
              {t('home.deckTitle', { defaultValue: 'Music library for focused listening.' })}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-dim)] md:text-base">
              {t('home.deckSubtitle', { defaultValue: 'Browse new songs, save favorites, build playlists and play every track from a clean studio console.' })}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/browse?sort=newest" className="studio-primary-button"><Music2 size={18} />{t('home.listen')}</Link>
              <Link to="/playlists" className="studio-secondary-button"><Library size={18} />{t('nav.playlists')}</Link>
              <Link to="/explore" className="studio-secondary-button"><Disc3 size={18} />{t('nav.genres')}</Link>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 max-w-xl">
              <Metric value={String(totalTracks || 22)} label={t('common.track', { count: totalTracks || 22 })} />
              <Metric value={String(genres.length)} label={t('nav.genres')} />
              <Metric value={String(playlists.length)} label={t('nav.playlists')} />
            </div>
          </div>

          <div className="studio-panel-flat overflow-hidden p-3">
            {featured ? (
              <div className="grid grid-cols-[6.5rem_1fr] gap-4 md:grid-cols-[9rem_1fr]">
                <div className="aspect-square overflow-hidden rounded-2xl bg-[var(--surface-hover)] studio-cover-glow">
                  {featured.cover_path ? (
                    <img src={featured.cover_path} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,var(--accent),var(--accent-3))]"><Music2 size={42} className="text-white/90" /></div>
                  )}
                </div>
                <div className="min-w-0 py-1">
                  <div className="studio-kicker mb-2 flex items-center gap-2"><Sparkles size={14} />{t('home.featured', { defaultValue: 'Featured track' })}</div>
                  <Link to={`/track/${featured.slug}`} className="block truncate text-xl font-black text-[var(--text)] hover:text-[var(--accent)] md:text-2xl">{featured.title}</Link>
                  <Link to={`/browse?artist=${encodeURIComponent(featured.artist)}`} className="mt-1 block truncate text-sm text-[var(--text-dim)] hover:text-[var(--accent)]">{featured.artist}</Link>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => play(featured)} className="studio-primary-button min-h-0 px-4 py-2 text-sm"><Play size={16} fill="currentColor" />{t('track.playBtn')}</button>
                    <Link to={`/track/${featured.slug}`} className="studio-secondary-button min-h-0 px-4 py-2 text-sm"><AudioWaveform size={16} />{t('track.trackPage')}</Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-[var(--text-dim)]">{t('home.noTracksYet')}</div>
            )}
          </div>
        </div>
      </section>

      {/* New tracks */}
      {newTracks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="studio-section-title"><Sparkles size={18} className="text-[var(--accent)]" />{t('home.new')}</h2>
            <Link to="/browse?sort=newest" className="text-sm font-semibold text-[var(--accent)] hover:underline">{t('home.allLink')}</Link>
          </div>
          <div className="studio-track-list">
            {newTracks.map((track, idx) => (
              <TrackCard key={track.id} track={track} tracks={newTracks} idx={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Popular tracks */}
      <section>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="studio-section-title"><TrendingUp size={18} className="text-[var(--accent-2)]" />{t('home.popular')}</h2>
          <div className="flex gap-1 bg-[var(--surface)] rounded-full border border-[var(--border)] p-1">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs rounded-full transition ${period === p.value ? 'bg-[var(--accent)] text-[#061018] font-bold' : 'text-[var(--text-dim)] hover:bg-[var(--surface-hover)]'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {popular.length > 0 ? (
          <div className="studio-track-list">
            {popular.map((track, idx) => (
              <TrackCard key={track.id} track={track} tracks={popular} idx={idx} />
            ))}
          </div>
        ) : (
          <div className="studio-panel-flat p-8 text-center text-[var(--text-dim)] text-sm">
            {t('home.noData')}
          </div>
        )}
      </section>

      {featuredCollections.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="studio-section-title"><Library size={18} className="text-[var(--accent)]" />{t('home.collectionsSection', { defaultValue: 'Studio collections' })}</h2>
            <Link to="/playlists" className="text-sm font-semibold text-[var(--accent)] hover:underline">{t('home.allLink')}</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {featuredCollections.map(coll => <CollectionCard key={coll.slug} collection={coll} />)}
          </div>
        </section>
      )}

      {/* Playlists */}
      {playlists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="studio-section-title"><Library size={18} className="text-[var(--accent-3)]" />{t('home.playlistsSection')}</h2>
            <Link to="/playlists" className="text-sm font-semibold text-[var(--accent)] hover:underline">{t('home.allLink')}</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {playlists.map(pl => (
              <PlaylistCard key={pl.id} playlist={pl} />
            ))}
          </div>
        </section>
      )}

      {/* Genres grid */}
      {genres.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="studio-section-title"><Disc3 size={18} className="text-[var(--accent-2)]" />{t('home.genresSection')}</h2>
            <Link to="/explore" className="text-sm font-semibold text-[var(--accent)] hover:underline">{t('home.allLink')}</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {genres.map((genre, idx) => {
              const colors = [
                'from-cyan-500/25 to-blue-500/10',
                'from-lime-400/25 to-emerald-500/10',
                'from-rose-500/25 to-fuchsia-500/10',
                'from-amber-400/25 to-orange-500/10',
              ]
              return (
              <Link key={genre.id} to={`/browse?genres=${genre.id}`}
                className={`p-4 rounded-2xl bg-gradient-to-br ${colors[idx % colors.length]} border border-[var(--border)] hover:border-[var(--accent)]/40 transition group`}>
                <p className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition">{genre.name}</p>
                <p className="text-xs text-[var(--text-dim)] mt-1">{genre.track_count ?? 0} {t('common.track', { count: genre.track_count ?? 0 })}</p>
              </Link>
              )
            })}
          </div>
        </section>
      )}

      {newTracks.length === 0 && (
        <div className="text-center py-20 text-[var(--text-dim)]">
          <Music2 size={42} className="mx-auto mb-4 text-[var(--accent)]" />
          <p className="text-lg">{t('home.noTracksYet')}</p>
          <p className="text-sm mt-1">{t('home.uploadHint')}</p>
        </div>
      )}
    </div>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
      <div className="text-xl font-black text-[var(--text)]">{value}</div>
      <div className="mt-0.5 truncate text-[0.68rem] font-semibold uppercase tracking-wide text-[var(--text-dim)]">{label}</div>
    </div>
  )
}

import { useState } from 'react'

const features = [
  { icon: '🎧', title: 'Фоновое воспроизведение', desc: 'Музыка играет даже когда popup закрыт. Не нужна открытая вкладка.' },
  { icon: '📋', title: 'Плейлисты', desc: 'Просматривай свои и публичные плейлисты. Играй целиком одним кликом.' },
  { icon: '🎭', title: 'Жанры', desc: 'Фильтруй треки по жанрам — выбери настроение в один клик.' },
  { icon: '🔥', title: 'Топ треков', desc: 'Самые популярные треки всегда под рукой.' },
  { icon: '❤️', title: 'Избранное', desc: 'Войди в аккаунт и слушай свои любимые треки.' },
  { icon: '📻', title: 'Радио режим', desc: 'Автоматически включает следующий трек. Бесконечная музыка.' },
  { icon: '🔀', title: 'Перемешивание', desc: 'Случайный порядок — каждый раз новый плейлист.' },
  { icon: '🔍', title: 'Поиск', desc: 'Быстрый поиск по названию и исполнителю.' },
]

const steps = [
  {
    num: '1',
    title: 'Скачай расширение',
    desc: 'Нажми кнопку выше — загрузится ZIP-архив с расширением.',
    icon: '📥',
  },
  {
    num: '2',
    title: 'Распакуй архив',
    desc: 'Распакуй скачанный musicbox-extension.zip в любую удобную папку на компьютере.',
    icon: '📂',
  },
  {
    num: '3',
    title: 'Открой расширения в Chrome',
    desc: <>Перейди по адресу <code className="inline-code">chrome://extensions/</code> или нажми <strong>⋮ → Расширения → Управление расширениями</strong>.</>,
    icon: '🧩',
  },
  {
    num: '4',
    title: 'Включи режим разработчика',
    desc: 'В правом верхнем углу страницы расширений включи переключатель «Режим разработчика».',
    icon: '🔧',
  },
  {
    num: '5',
    title: 'Загрузи расширение',
    desc: 'Нажми «Загрузить распакованное расширение» и выбери папку, куда распаковал архив.',
    icon: '📤',
  },
  {
    num: '6',
    title: 'Готово! Слушай музыку',
    desc: 'Иконка 🎵 появится на панели браузера. Кликай — и наслаждайся музыкой!',
    icon: '🎵',
  },
]

export default function Extension() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">

      {/* Hero */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-medium">
          <span>🧩</span> Расширение для Chrome
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text)]">
          MusicBox <span className="text-[var(--accent)]">Player</span>
        </h1>

        <p className="text-lg text-[var(--text-dim)] max-w-xl mx-auto">
          Мини-плеер прямо в браузере. Слушай музыку без открытой вкладки —
          как настоящее десктопное приложение.
        </p>

        <div className="flex items-center justify-center gap-4 pt-2">
          <a
            href="/uploads/musicbox-extension.zip"
            download
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold text-base hover:opacity-90 transition shadow-lg shadow-[var(--accent)]/25"
          >
            <span className="text-xl">📥</span>
            Скачать расширение
          </a>
          <span className="text-sm text-[var(--text-dim)]">v1.0 · 12 KB · Chrome / Edge / Brave</span>
        </div>
      </div>

      {/* Preview mockup */}
      <div className="relative max-w-sm mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-[var(--border)]">
          <div className="bg-[#1a1a28] p-4 space-y-3">
            {/* Fake header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎵</span>
                <span className="text-sm font-bold text-white">MusicBox</span>
              </div>
              <div className="text-xs text-zinc-500">pedsyte</div>
            </div>
            {/* Fake search */}
            <div className="bg-[#0f0f17] rounded-md px-3 py-2 text-xs text-zinc-600">🔍 Поиск треков...</div>
            {/* Fake tabs */}
            <div className="flex gap-3 text-xs border-b border-zinc-800 pb-2">
              <span className="text-purple-400 border-b-2 border-purple-400 pb-1">Все</span>
              <span className="text-zinc-500">🔥 Топ</span>
              <span className="text-zinc-500">🎭</span>
              <span className="text-zinc-500">📋</span>
              <span className="text-zinc-500">♥</span>
            </div>
            {/* Fake tracks */}
            {[
              { t: 'Midnight Drive', a: 'Suno AI', d: '3:24' },
              { t: 'Electric Dreams', a: 'Suno AI', d: '2:58' },
              { t: 'Summer Vibes', a: 'Suno AI', d: '4:12' },
            ].map((track, i) => (
              <div key={i} className={`flex items-center gap-3 py-1.5 ${i === 0 ? 'opacity-100' : 'opacity-50'}`}>
                <div className={`w-9 h-9 rounded-md flex items-center justify-center text-xs ${i === 0 ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                  {i === 0 ? '▶' : '♪'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium ${i === 0 ? 'text-purple-400' : 'text-zinc-300'}`}>{track.t}</div>
                  <div className="text-[10px] text-zinc-500">{track.a}</div>
                </div>
                <div className="text-[10px] text-zinc-600">{track.d}</div>
              </div>
            ))}
            {/* Fake player */}
            <div className="mt-2 pt-3 border-t border-zinc-800 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-purple-900/50" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white">Midnight Drive</div>
                  <div className="text-[10px] text-zinc-500">Suno AI</div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-zinc-400">⏮</span>
                  <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm">⏸</span>
                  <span className="text-zinc-400">⏭</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-600">1:42</span>
                <div className="flex-1 h-1 bg-zinc-800 rounded overflow-hidden">
                  <div className="h-full w-1/2 bg-purple-500 rounded" />
                </div>
                <span className="text-[9px] text-zinc-600">3:24</span>
              </div>
            </div>
          </div>
        </div>
        {/* Glow */}
        <div className="absolute -inset-4 bg-[var(--accent)]/5 rounded-3xl -z-10 blur-2xl" />
      </div>

      {/* Features */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text)] text-center mb-8">Возможности</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-default ${
                hoveredFeature === i
                  ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 scale-[1.02]'
                  : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]/20'
              }`}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="text-sm font-semibold text-[var(--text)] mb-1">{f.title}</h3>
              <p className="text-xs text-[var(--text-dim)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Installation Steps */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text)] text-center mb-2">Как установить</h2>
        <p className="text-center text-[var(--text-dim)] mb-8">6 простых шагов — займёт меньше минуты</p>

        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.num} className="flex gap-4 items-start group">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[var(--accent)]/20 group-hover:scale-110 transition">
                {step.num}
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{step.icon}</span>
                  <h3 className="text-sm font-semibold text-[var(--text)]">{step.title}</h3>
                </div>
                <p className="text-sm text-[var(--text-dim)] mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Browser compatibility */}
      <div className="text-center space-y-4 pb-8">
        <h2 className="text-2xl font-bold text-[var(--text)]">Совместимость</h2>
        <div className="flex justify-center gap-8">
          {[
            { name: 'Chrome', icon: '🌐', ok: true },
            { name: 'Edge', icon: '🔷', ok: true },
            { name: 'Brave', icon: '🦁', ok: true },
            { name: 'Opera', icon: '🔴', ok: true },
            { name: 'Firefox', icon: '🦊', ok: false },
          ].map((b) => (
            <div key={b.name} className={`flex flex-col items-center gap-1 ${b.ok ? '' : 'opacity-40'}`}>
              <span className="text-2xl">{b.icon}</span>
              <span className="text-xs text-[var(--text-dim)]">{b.name}</span>
              <span className="text-xs">{b.ok ? '✅' : '❌'}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-dim)]">Работает во всех Chromium-браузерах (Manifest V3)</p>

        <a
          href="/uploads/musicbox-extension.zip"
          download
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold text-base hover:opacity-90 transition mt-4"
        >
          📥 Скачать MusicBox Player
        </a>
      </div>
    </div>
  )
}

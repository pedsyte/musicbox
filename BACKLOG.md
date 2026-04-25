# MusicBox — Backlog

## 2026-04-25 — v1.3: Studio Deck Redesign

### Что сделано
- **Baseline build fixes**: добавлены недостающие frontend-типы (`Tag.translations`, `Playlist.user_id`, `Comment.avatar`, optional admin stats aliases), исправлены `Tooltip` ref, тип ID удаления трека из плейлиста и тип темы в Settings.
- **Studio Deck UI**: собраны новые dark/light tokens, фоновые слои, reusable `studio-*` классы для panels, buttons, inputs, track lists и cards.
- **Lucide icons**: добавлен `lucide-react`; публичная навигация, player, queue, карточки, download menu и action controls переведены с emoji/символов на единые иконки.
- **Public shell**: обновлены Sidebar, Header, MobileNav, PlayerBar, MobilePlayer, QueuePanel и GenreSidebar.
- **Public pages**: переделаны Home dashboard, Browse library console, Track detail, Explore, Playlists, Playlist, Collection, Favorites, Extension, Login/Register, Settings, Privacy и 404.
- **i18n**: обновлены RU/UK/EN/ES/DE/FR строки для новых видимых labels; старые emoji убраны из публичных текстов.
- **Theme boot**: сохранённая light/dark тема теперь применяется на уровне `App` сразу при загрузке пользователя, а не только после захода в Settings.

### Проверки
- `npm install lucide-react@^1.11.0`
- `npm run build -- --outDir /tmp/musicbox-redesign-check-dist`
- `npm run build` в `/opt/musicbox/frontend` для production `dist`
- JSON parse всех `frontend/src/i18n/locales/*.json`
- Live HTTP 200: `/`, hashed JS, hashed CSS
- Live API smoke: tracks, popular, genres, public playlists, collections
- Browser smoke: desktop home, browse, track, queue/player; mobile home/player; authenticated Settings; real light theme and restore to dark

### Замечания
- Backend/API, nginx, uploads, auth, playlists, favorites, streaming и waveform не менялись.
- Admin визуально не редизайнился, кроме shared type/style compatibility, как и планировалось.
- Production build остаётся с Vite warning о JS chunk > 500 kB; это предупреждение о code splitting, не ошибка сборки.

## 2026-04-12 — v1.2: Комплексное тестирование + исправления

### Что сделано
- Комплексное тестирование всех 45 пунктов (8 фаз): главная, browse, трек, плеер, авторизация, плейлисты, админка
- **Pluralize**: добавлена правильная склонение "1 трек / 2 трека / 5 треков" в 6 страницах
- **Genre градиенты**: карточки жанров на главной теперь с градиентами (как на /explore)
- **Waveform**: исправлены пропсы на странице трека (progress → currentTime/duration)
- **Добавить в плейлист**: новый пункт в контекстном меню TrackCard с sub-menu выбора плейлиста
- **Admin CRUD жанров**: бэкенд переведён с Form(...) на JSON body (Pydantic) — фронт шлёт JSON
- **Admin tracks update**: фронт переведён на FormData вместо JSON для совместимости с бэкендом
- **FLAC/WAV**: обе форматы теперь quality tier 3 (lossless) — FLAC не появляется при скачивании WAV
- **stream_cache** добавлен в .gitignore

### Найденные и исправленные баги
1. **"1 треков"** → pluralize() в 6 файлах
2. **Жанры без градиента** на главной → gradient colors из Explore
3. **Waveform молчит** на TrackPage → правильные пропсы currentTime/duration
4. **FLAC в WAV downloads** → FORMAT_QUALITY flac=3 (был 2)
5. **Нет "Добавить в плейлист"** в UI → sub-menu в TrackCard
6. **Genre CRUD 422** → JSON body вместо Form
7. **Track edit 422** → FormData вместо JSON

## 2026-04-11 — v1.1: Мульти-формат аудио + качество стриминга

### Что сделано
- **Multi-format upload**: поддержка WAV, MP3, FLAC, OGG, AAC/M4A
- **Format detection**: автоматическое определение формата через ffprobe + mutagen
- **Download formats**: доступные форматы скачивания зависят от оригинала (WAV→[wav,mp3,ogg], FLAC→[flac,mp3,ogg], MP3→[mp3])
- **Stream quality**: выбор качества стриминга в настройках плеера (original/mp3)
- **DownloadMenu**: компонент с выпадающим меню выбора формата скачивания
- **Stream caching**: конвертированные потоки кэшируются на диске

## 2026-04-10 — v1.0: Первый релиз

### Что сделано
- Полная реализация проекта с нуля
- **Backend**: FastAPI с PostgreSQL (async), JWT авторизация, WAV→MP3 конвертация через FFmpeg, генерация waveform peaks, стриминг аудио, фильтрация по жанрам (include/exclude), плейлисты, избранное, админ-панель
- **Frontend**: React 19 SPA с Vite, TypeScript, Tailwind CSS 4, Zustand, тёмная и светлая тема, адаптивный дизайн
- **Деплой**: systemd + nginx + SSL (Let's Encrypt) на musicbox.gornich.fun
- **Главная страница**: добавлен слайд #4 в промо-карусель + карточка в секции "Аудио" на gornich.fun
- **GitHub**: репозиторий pedsyte/musicbox

### Решённые проблемы
- **bcrypt 5.x несовместимость**: passlib не работает с bcrypt 5.0 (ValueError). Решение: даунгрейд до bcrypt==4.1.3
- **Экспорт API**: default vs named export конфликт. Решение: двойной экспорт `export { api }` + `export default api`
- **baseURL дублирование**: Axios baseURL `/api` + пути `/api/...` = `/api/api/...`. Решение: убрали baseURL, оставили полные пути в вызовах

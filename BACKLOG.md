# MusicBox — Backlog

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

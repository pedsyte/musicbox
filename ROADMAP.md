# MusicBox — Roadmap

## Фаза 0: Инфраструктура
- [x] Создать директорию /opt/musicbox
- [x] Создать PostgreSQL базу данных `musicbox`
- [x] Настроить systemd сервис
- [x] Настроить nginx reverse proxy
- [x] Получить SSL сертификат (Let's Encrypt)
- [x] Создать GitHub репозиторий

## Фаза 1: Backend API
- [x] Модели базы данных (User, Track, Genre, Playlist, Favorite)
- [x] JWT авторизация (регистрация, логин, текущий пользователь)
- [x] Эндпоинт загрузки треков (WAV → MP3 конвертация)
- [x] Генерация waveform peaks (200 точек)
- [x] Стриминг аудио (FileResponse с Range)
- [x] Фильтрация треков по жанрам (включить / исключить)
- [x] Поиск по названию и артисту
- [x] Сортировка (newest, oldest, title, artist, duration)
- [x] Пагинация
- [x] CRUD плейлистов (публичные / приватные)
- [x] Добавление / удаление / перестановка треков в плейлисте
- [x] Система избранного
- [x] CRUD жанров (админ)
- [x] Статистика (админ)
- [x] Скачивание треков (MP3 / WAV)
- [x] Настройки пользователя (тема, waveform, смена пароля)
- [x] Seed: администратор + 40 жанров

## Фаза 2: Frontend SPA
- [x] Vite + React 19 + TypeScript + Tailwind CSS 4
- [x] Zustand stores (auth, player)
- [x] Система тем (CSS variables, dark / light)
- [x] Axios API клиент с JWT interceptor
- [x] Layout (Sidebar + Header + PlayerBar + QueuePanel)
- [x] Компонент PlayerBar (десктоп + мобильный)
- [x] Компонент Waveform (canvas, click-to-seek)
- [x] Компонент TrackCard (с контекстным меню)
- [x] Компонент Tooltip (300ms задержка)
- [x] Компонент QueuePanel (drag-n-drop)
- [x] Mobile навигация
- [x] MediaSession API (фоновое управление)

## Фаза 3: Страницы
- [x] Главная (hero + новые треки + жанры)
- [x] Обзор (поиск + фильтры + пагинация)
- [x] Страница трека (обложка + waveform + lyrics)
- [x] Жанры (сетка с градиентами)
- [x] Плейлисты (мои + публичные + создание)
- [x] Страница плейлиста (треки + управление)
- [x] Избранное
- [x] Вход / Регистрация
- [x] Настройки (тема, waveform, пароль, выход)
- [x] Админ-панель (загрузка, треки, жанры, статистика)

## Фаза 4: Деплой
- [x] Production build
- [x] Systemd + nginx + SSL
- [x] Обновление главной страницы gornich.fun (слайд + карточка)
- [x] Git commit + push на GitHub

## Фаза 5: Studio Deck Redesign
- [x] Исправить baseline TypeScript build: frontend-типы, Tooltip ref, playlist track id, settings theme typing
- [x] Добавить `lucide-react` и заменить emoji в публичной навигации, карточках, player/queue/action controls
- [x] Пересобрать дизайн-систему в `main.css`: dark/light tokens, Studio Deck surfaces, reusable panel/button/list/card/input classes, focus/reduced-motion states
- [x] Переделать публичный shell: Sidebar, Header, MobileNav, PlayerBar, MobilePlayer, QueuePanel, GenreSidebar
- [x] Переделать публичные страницы: Home, Browse, Track, Explore, Playlists, Playlist, Collection, Favorites, Extension, Auth, Settings, Privacy, 404
- [x] Обновить 6 локалей под новые видимые подписи и убрать старые emoji из публичных строк
- [x] Проверить live deploy на `https://musicbox.gornich.fun/`: HTML/assets/API 200, browser smoke desktop/mobile, playback bar, queue, auth state, light/dark theme

## Фаза 6: Professional SEO Semantic Core
- [x] Убрать публичные AI/Suno/generated формулировки о музыке из MusicBox UI/meta/i18n и промо на `gornich.fun`
- [x] Добавить backend SEO-render для `/`, `/browse`, `/explore`, `/playlists`, `/track/:slug`, `/collection/:slug`, `/playlist/:id`, `/favorites`
- [x] Отдавать canonical, OG/Twitter, `rel="search"`, JSON-LD и видимый semantic fallback до загрузки React
- [x] Индексировать полный lyrics на странице трека и добавить поиск по lyrics/description/genres/tags
- [x] Добавить `pg_trgm` indexes, keyboard-layout/translit query variants, `search_match` и `search_snippet`
- [x] Добавить backend `/robots.txt`, `/sitemap.xml`, `/opensearch.xml`, `/seo/semantic-index.json`, `/seo/structured-data.json`
- [x] Обновить nginx routes, production build, live SEO smoke и редиректы старых `suno-*` slugs на нейтральные canonical URL

## Фаза 7: Будущее (TODO)
- [ ] Batch upload (несколько треков за раз)
- [ ] Drag-n-drop загрузка
- [x] Добавление треков в плейлист из контекстного меню
- [ ] Счётчик прослушиваний
- [ ] Топ треков
- [ ] Рекомендации на основе жанров
- [ ] Автоматическое определение BPM
- [ ] Equalizer
- [ ] Crossfade между треками
- [ ] PWA Support (offline)
- [ ] Push уведомления о новых треках

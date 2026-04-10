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

## Фаза 5: Будущее (TODO)
- [ ] Batch upload (несколько треков за раз)
- [ ] Drag-n-drop загрузка
- [ ] Добавление треков в плейлист из контекстного меню
- [ ] Счётчик прослушиваний
- [ ] Топ треков
- [ ] Рекомендации на основе жанров
- [ ] Автоматическое определение BPM
- [ ] Equalizer
- [ ] Crossfade между треками
- [ ] PWA Support (offline)
- [ ] Push уведомления о новых треках

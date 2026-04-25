# MusicBox

Музыкальный стриминг-сервис с треками, текстами песен, плейлистами и жанрами.

**URL:** https://musicbox.gornich.fun

## Стек

### Backend
- **Python 3.11** + **FastAPI** — REST API
- **PostgreSQL** + **SQLAlchemy 2.0** (async) — база данных
- **FFmpeg** — конвертация WAV → MP3 (320kbps)
- **JWT** (python-jose) — авторизация (72ч)
- **bcrypt** — хеширование паролей

### Frontend
- **React 19** + **TypeScript** — SPA
- **Vite 6** — сборка
- **Tailwind CSS 4** — стили
- **Zustand 5** — стейт-менеджер
- **React Router v7** — маршрутизация
- **Axios** — HTTP-клиент

## Функционал

### Для пользователей
- Регистрация и авторизация (минимальная, логин + пароль)
- Просмотр и поиск треков (по названию, артисту, жанру и строкам текста)
- Фильтрация по жанрам (включить / исключить)
- Сортировка (новые, старые, по названию, артисту, длительности)
- Создание плейлистов (публичные / приватные)
- Избранное (❤️)
- Управление очередью (drag-n-drop, следующий, в конец)
- Фоновое воспроизведение с MediaSession API
- Форма волны (waveform) с toggle ON/OFF
- Тёмная и светлая тема
- Скачивание треков (MP3)
- Страница трека с текстом (lyrics) и waveform

### Для администратора
- Загрузка треков (WAV → автоконвертация в MP3)
- Загрузка обложек
- Редактирование метаданных треков
- Управление жанрами (CRUD)
- Статистика (треки, жанры, пользователи, плейлисты)

## Структура

```
/opt/musicbox/
├── backend/
│   ├── main.py           # FastAPI app
│   ├── database.py       # async engine + session
│   ├── models.py         # SQLAlchemy models (7 tables)
│   ├── auth.py           # JWT + bcrypt + dependencies
│   ├── audio.py          # FFmpeg utils (convert, peaks, duration)
│   ├── seed.py           # Admin user + 40 genres
│   ├── requirements.txt
│   └── routes/
│       ├── auth.py       # register, login, me, settings
│       ├── tracks.py     # list, detail, stream, waveform, download
│       ├── admin.py      # upload, update, delete tracks + genre CRUD
│       ├── genres.py     # list genres with counts
│       ├── playlists.py  # CRUD, add/remove/reorder tracks
│       └── favorites.py  # add, remove, list
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx       # Router
│   │   ├── Layout.tsx    # Shell (Sidebar, Header, Player, Queue)
│   │   ├── main.css      # CSS variables, themes, Tailwind
│   │   ├── lib/          # api, types, utils
│   │   ├── stores/       # authStore, playerStore (Zustand)
│   │   ├── components/   # PlayerBar, Waveform, Tooltip, etc.
│   │   └── pages/        # Home, Browse, TrackPage, Explore, etc.
│   └── dist/             # Production build
└── uploads/
    ├── audio/            # MP3 files
    └── covers/           # Cover images
```

## API

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Авторизация |
| GET | /api/auth/me | Текущий пользователь |
| PUT | /api/auth/settings | Настройки (тема, waveform, пароль) |
| GET | /api/tracks | Список треков + фильтры |
| GET | /api/tracks/:id | Детали трека |
| GET | /api/tracks/:id/stream | Аудиопоток |
| GET | /api/tracks/:id/waveform | Peaks для waveform |
| GET | /api/tracks/:id/download | Скачать (mp3/wav) |
| GET | /api/genres | Список жанров |
| POST | /api/admin/tracks | Загрузить трек (WAV) |
| PUT | /api/admin/tracks/:id | Обновить трек |
| DELETE | /api/admin/tracks/:id | Удалить трек |
| POST/PUT/DELETE | /api/admin/genres | CRUD жанров |
| GET | /api/admin/stats | Статистика |
| GET | /api/playlists | Мои плейлисты |
| GET | /api/playlists/public | Публичные плейлисты |
| POST | /api/playlists | Создать плейлист |
| GET/PUT/DELETE | /api/playlists/:id | Управление плейлистом |
| POST/DELETE | /api/playlists/:id/tracks | Добавить/убрать трек |
| POST/DELETE | /api/favorites/:id | Добавить/убрать из избранного |
| GET | /api/favorites | Список избранного |

## Деплой

- **Systemd:** `/etc/systemd/system/musicbox.service`
- **Nginx:** `/etc/nginx/conf.d/musicbox.conf`
- **SSL:** Let's Encrypt (certbot)
- **Port:** 8091 (uvicorn)
- **Env:** `/etc/musicbox.env`

## Администратор

- Логин: `pedsyte`
- Пароль: `Vjybnjh1991`

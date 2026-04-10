# MusicBox — Backlog

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

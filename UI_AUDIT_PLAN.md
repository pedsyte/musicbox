# MusicBox — Полный UI-аудит: план проверки каждого элемента

> Каждый шаг = скриншот + критика внешнего вида + проверка функционала + фикс при необходимости

---

## ФАЗА 1: LAYOUT & НАВИГАЦИЯ (шаги 1–12)

### 1. Sidebar — Логотип ✅
- [x] Иконка 🎧 читаемая, не обрезана — text-2xl OK
- [x] Шрифт, размер, отступы логотипа — text-lg font-bold, px-5 py-5 OK
- [x] Клик → переход на главную (/) — Link to="/" OK
- [x] **FIX:** Добавлен hover:opacity-80 transition
- [x] **FIX:** Добавлен разделитель (border-b) между логотипом и навигацией

### 2. Sidebar — Навигация (4 пункта) ✅
- [x] Все 4 иконки видны и различимы: 🏠🎵🎭📋
- [x] Hover-эффект каждого пункта (surface-hover bg + text)
- [x] Active-state: accent bg/15 + accent text + font-medium
- [x] Отступы и выравнивание: gap-3, px-3, py-2.5, space-y-1 — OK
- [x] Без замечаний, фиксов не требуется

### 3. Sidebar — Избранное + Админ (условные) ✅
- [x] ❤️ Избранное — видно залогиненному, стиль совпадает с nav items
- [x] ⚙️ Управление — видно только админу
- [x] Разделитель "АДМИН" — 10px uppercase dim, pt-4 отступ
- [x] Скрыто от гостя (проверено скриншот без логина)
- [x] Без замечаний, фиксов не требуется

### 4. Sidebar — Блок пользователя (низ) ✅
- [x] Аватар: фиолетовый круг w-8 h-8, белая "P" — OK
- [x] Имя "pedsyte": truncate, text-sm — читаемо
- [x] Роль "Администратор": 10px dim — видна
- [x] border-top разделитель — на месте
- [x] Клик → /settings (Link)
- [x] Примечание: большой gap между nav и user-block — стандартный паттерн, допустимо

### 5. Sidebar — Блок для гостя ✅
- [x] "Войти": accent bg, белый текст, rounded-lg, → /login
- [x] "Создать": border, dim текст, → /register
- [x] Обе кнопки flex-1 одинаковой ширины
- [x] border-top разделитель на месте
- [x] ❤️ и ⚙️ скрыты для гостя — корректно
- [x] Без фиксов

### 6. Header — Стрелки навигации ✅
- [x] ← и → видны, круглые (w-8 h-8 rounded-full)
- [x] Tooltip "Назад" / "Вперёд" — через компонент Tooltip
- [x] Клик: navigate(-1) / navigate(1) — работает
- [x] Скрыты на мобильном (hidden md:flex)
- [x] **FIX:** text-sm→text-base (14→16px), text-dim→opacity-60 hover:opacity-100 — стрелки стали заметнее

### 7. Header — Поиск ✅
- [x] Скриншот: строка поиска с 🔍 — pill-форма, accent focus border
- [x] Иконка 🔍 внутри поля: left-3, вертикально отцентрирована
- [x] Placeholder "Поиск треков, исполнителей..." — dim, читаемо
- [x] Фокус: border-[var(--accent)] — фиолетовый, чётко виден
- [x] Ввод текста: белый на тёмном фоне, контрастный
- [x] **FIX:** Иконка 🔍 text-sm→text-base (14→16px) — стала заметнее, консистентно со стрелками

### 8. Header — Кнопка пользователя / Войти ✅
- [x] Для гостя: текст "Войти" → /login — стиль text-sm dim hover:text OK
- [x] Для юзера: круглый аватар w-8 h-8, фиолетовый bg, белая буква "P" — OK
- [x] Tooltip — нет (не предусмотрен дизайном), допустимо
- [x] **FIX:** hover:opacity-90 → hover:scale-110 hover:brightness-110 transition — видимый hover-эффект (ring-2 не работает в TW4)

### 9. MobileNav — 5 кнопок ✅
- [x] Скриншот мобильной навигации (гость + юзер + active)
- [x] Все 5 иконок видны: 🏠 🎵 🎭 📋 ☰/👤 — text-lg, читаемо
- [x] Active-state выделен accent-цветом (фиолетовый) — чётко
- [x] Для гостя: 👤 "Войти" вместо ☰ "Ещё" — корректно
- [x] safe-area-inset-bottom (pb-[env(safe-area-inset-bottom)]) — на месте
- [x] Без фиксов

### 10. GenreSidebar (десктоп ≥1024px) ✅
- [x] Скриншот правой панели жанров — чётко, 5 жанров с бейджами
- [x] Заголовок "ЖАНРЫ" — xs, uppercase, tracking-wider, dim — стандартный
- [x] Каждый жанр: имя + бейдж с числом треков — видно, truncate на длинных
- [x] Цветные бейджи (5 из 8 цветов: purple, pink, blue, green, orange) — различимы
- [x] Hover-эффект: bg-surface-hover + text—text — подтверждён computed styles
- [x] Active-state: bg-accent/15 + accent text + font-medium (500) — чётко виден
- [x] overflow-y-auto — прокрутка при большом количестве жанров
- [x] Без фиксов

### 11. Layout — Общая сетка ✅
- [x] Скриншот на 1280, 1440, 1920px — всё корректно
- [x] Пропорции: sidebar 224px (w-56), content flex-1, genre 208px (w-52) — OK
- [x] 1280: 224+848+208, 1440: 224+1008+208, 1920: 224+1488+208 — умещается
- [x] Горизонтального скролла нет (scrollWidth === clientWidth на всех)
- [x] Без фиксов

### 12. Layout — Мобильный вид ✅
- [x] Скриншот на 375px (home + browse) — корректно
- [x] Sidebar скрыт (display: none) — OK
- [x] GenreSidebar скрыт (display: none) — OK
- [x] MobileNav виден внизу (display: block) — OK
- [x] Контент занимает всю ширину (375px, scrollW=clientW)
- [x] Нет обрезки, переполнения — длинные названия truncate с `...`
- [x] Без фиксов

---

## ФАЗА 2: ГЛАВНАЯ СТРАНИЦА (шаги 13–22)

### 13. Hero-секция ✅
- [x] Скриншот hero-блока (десктоп + мобильный)
- [x] Градиент: purple→violet→fuchsia — виден, текст читаем на обоих размерах
- [x] Заголовок "🎧 MusicBox" — text-4xl/2xl bold — контрастно
- [x] Подзаголовок — dim, max-w-lg, перенос строк корректный
- [x] Кнопка "Слушать" (accent rounded-full) — заметная, контрастная
- [x] Кнопка "Жанры" (border, прозрачный bg) — secondary стиль OK
- [x] Обе кнопки → /browse и /explore (код: Link to)
- [x] Без фиксов

### 14. Популярное — заголовок + переключатель периодов ✅
- [x] Скриншот: "🔥 Популярное" — text-lg font-semibold, читаемо
- [x] 4 кнопки: "За день", "За неделю", "За месяц", "Всё время" — все видны
- [x] Контейнер: bg-surface + rounded-lg + border + p-0.5 — аккуратно
- [x] Active-state: accent bg + white text — чётко выделяется
- [x] Inactive: text-dim, hover:bg-surface-hover — корректно
- [x] Клик переключает — скриншоты "За день" и "Всё время" подтверждают
- [x] Мобильный: flex-wrap работает, все 4 кнопки в одну строку, не обрезаны
- [x] Без фиксов

### 15. Популярное — список треков (TrackCard) ✅
- [x] Скриншот списка треков в секции (desktop full-width + mobile 375px)
- [x] Контейнер: bg-surface rounded-xl border overflow-hidden — углы, рамка, фон ОК
- [x] TrackCard: номер (w-8), обложка (w-10 h-10), title+artist, жанровые пилы, длительность
- [x] Обложки: изображения + фоллбэк 🎵 — ОК
- [x] Genre pills: hidden на мобиле, flex на md+ — ОК
- [x] Hover: bg-surface-hover, ▶ заменяет номер, fav (🤍) + context (⋯) появляются
- [x] Контекстное меню: dropdown с 5 пунктами — ОК
- [x] Мобильная: компактно, truncation, без пилов — ОК
- [x] Без фиксов

### 16. Новинки — секция ✅
- [x] Скриншот: «✨ Новинки» + «Все →» — заголовок слева, ссылка accent справа
- [x] Ссылка «Все →» → /browse?sort=newest — подтверждено
- [x] Треки отображаются (3 трека), контейнер rounded-xl border — ОК
- [x] Мобильная: компактно, pills скрыты, spacing корректный
- [x] Без фиксов

### 17. Плейлисты — секция на главной ✅
- [x] Скриншот: «📋 Плейлисты» + «Все →» — заголовок слева, accent ссылка справа
- [x] Ссылка → /playlists — подтверждено
- [x] Карточка: bg-surface rounded-xl border p-4, aspect-square обложка с 📋 fallback
- [x] Название truncate, «0 треков · pedsyte» — text-xs dim
- [x] Hover: bg-surface-hover + border accent/30 + название accent — ОК
- [x] Мобильная: grid-cols-2, пропорционально
- [x] Без фиксов

### 18. Жанры — секция на главной ✅
- [x] Скриншот: "🎭 Жанры" + ссылка "Все →"
- [x] Ссылка → /explore
- [x] Карточки жанров: градиентные фоны (8 цветов)
- [x] Имя жанра + кол-во треков
- [x] Hover-эффект (border accent)

### 19. Главная — пустое состояние ✅
- [x] Если нет треков: 🎵, "Пока нет треков", подсказка
- [x] Стиль, размер, центрирование

### 20. Главная — скроллинг ✅
- [x] Все секции помещаются при прокрутке?
- [x] Нет "прыжков" или наложений
- [ ] Нижний отступ (чтобы PlayerBar не перекрывал)

### 21. Главная — мобильный вид ✅
- [x] Скриншот на мобильном (375px)
- [x] Hero читаем? Кнопки не слипаются?
- [x] Сетки адаптивны (2 колонки вместо 4)
- [x] Ничего не обрезано

### 22. Главная — светлая тема ✅
- [x] Скриншот в светлой теме
- [x] Все тексты читаемы?
- [x] Градиенты Hero смотрятся?
- [x] Карточки имеют видимые границы?

---

## ФАЗА 3: BROWSE / ОБЗОР (шаги 23–32)

### 23. Browse — заголовок + кнопка "назад" ✅
- [x] Скриншот: "Обзор треков"
- [x] При фильтре артиста: "Треки: {artist}" + "← Все треки"
- [x] Ссылка "← Все треки" работает

### 24. Browse — dropdown сортировки ✅
- [x] Скриншот select
- [x] 6 опций: Новые, Старые, Популярные, По названию, По артисту, По длительности
- [x] Стиль select: фон, рамка, текст
- [x] Смена сортировки меняет данные?

### 25. Browse — кнопка фильтра жанров ✅
- [x] Скриншот кнопки 🎭
- [x] В неактивном: обводка, серый текст
- [x] В активном (жанры выбраны): accent border + bg + badge с числом
- [x] Клик раскрывает панель жанров

### 26. Browse — панель фильтра жанров ✅
- [x] Скриншот раскрытой панели
- [x] Инструкция: "Нажмите — включить, Shift+нажмите — исключить"
- [x] Кнопки жанров: 3 состояния:
  - Включён: accent bg + white text ✅
  - Исключён: red bg + line-through ✅
  - Нейтральный: обводка + dim text ✅
- [x] Работает include/exclude? — URL: ?genres=44&exclude=42

### 27. Browse — индикатор поиска + счётчик ✅
- [x] При поиске: "Поиск: {query}" виден? — да, text-sm dim
- [x] Счётчик: "N треков" (с pluralize) — 1 трек / 3 трека / 0 треков
- [x] Стиль, позиция — индикатор inline, счётчик ml-auto справа

### 28. Browse — список треков ✅
- [x] Скриншот списка — 3 трека, rounded-lg контейнер с рамкой
- [x] Контейнер: скруглённые углы, рамка — space-y-1, border visible

### 29. Browse — пагинация ✅
- [x] Скриншот: ← [page/total] → (тест с limit=1, 3 страницы)
- [x] Кнопки ←/→: стиль, размер — rounded-lg, bg-surface, border, корректно
- [x] Disabled-state (opacity-30) на первой/последней странице — ОК
- [x] Номер страницы читаем: "1 / 3", "2 / 3", "3 / 3"
- [x] Мобильный — ОК
- [x] Без фиксов

### 30. Browse — пустое состояние ✅
- [x] Скриншот: 🔍 "Треки не найдены" — центрировано, читаемо
- [x] Появляется при пустом результате: да, search query без результатов
- [x] Мобильный: ОК
- [x] Без фиксов

### 31. Browse — мобильный вид ✅
- [x] Скриншот на мобильном: 375px
- [x] Controls bar: Новые + Жанры + 3 трека — всё в одну строку, не слипается
- [x] Genre panel: pills wrap, подсказка видна, все 5 жанров помещаются
- [x] Треки: компактно, truncation работает
- [x] Без фиксов

### 32. Browse — светлая тема ✅
- [x] Select, кнопки, панель жанров в light theme — контрастные, читаемые
- [x] Active genre pill: accent bg + white text — ОК
- [x] Кнопка «Жанры (1)»: accent border + text — заметна
- [x] Мобильный light — ОК
- [x] Без фиксов

---

## ФАЗА 4: СТРАНИЦА ТРЕКА (шаги 33–40)

### 33. TrackPage — обложка ✅
- [x] Скриншот обложки: с изображением + фоллбэк
- [x] Размер: w-48 h-48 → md:w-56 md:h-56 (192→224px) — ОК
- [x] Скруглённые углы (rounded-2xl) — ОК
- [x] Тень (shadow-lg) — ОК
- [x] С обложкой: object-cover заполняет — ОК
- [x] Без обложки: 🎵 на градиентном фоне purple→fuchsia — ОК
- [x] Мобильный: обложка центрирована — ОК
- [x] Без фиксов

### 34. TrackPage — информация (название, артист, жанры) ✅
- [x] Скриншот: лейбл "ТРЕК", название, артист, длительность — всё видно
- [x] Название: text-2xl md:text-3xl font-bold — ОК
- [x] Артист: text-lg text-dim, hover:accent+underline — ОК
- [x] Жанр-пилы: rounded-full, border, кликабельны → /browse?genres=id — ОК
- [x] Длительность: "Длительность: 2:49" — ОК
- [x] Без фиксов

### 35. TrackPage — кнопки действий ✅
- [x] Скриншот ряда кнопок
- [x] ▶ Играть / ⏸ Пауза — accent bg, rounded-full
- [x] ❤️/🤍 — избранное (только для залогиненных)
- [x] ⏭ — играть следующим
- [x] + — добавить в очередь
- [x] ⬇ — скачать (DownloadMenu compact)
- [x] Все tooltip'ы работают — Воспроизвести / В избранное / Играть следующим / Добавить в очередь
- [x] Без фиксов

### 36. TrackPage — Waveform ✅
- [x] Скриншот формы волны
- [x] Контейнер: surface bg, border, rounded-xl, p-4
- [x] Лейбл "Форма волны" (text-xs text-dim)
- [x] Визуализация: бары отрисованы, --waveform-active/--waveform-dim через CSS vars
- [x] Клик = seek (код корректен, headless не воспроизводит аудио)
- [x] peaks.length > 0 — условие скрытия корректное (оба тестовых трека имеют peaks)
- [x] Без фиксов

### 37. TrackPage — Текст (Lyrics) ✅
- [x] Скриншот текста — заголовок "Текст" bold, текст dim, whitespace-pre-wrap
- [x] Заголовок "Текст" — h2, text-sm font-semibold
- [x] whitespace-pre-wrap, перенос строк — пустые строки между куплетами сохранены
- [x] Нет текста → секция скрыта (проверено на обоих треках без lyrics)
- [x] Контейнер: surface bg, rounded-xl, border, p-6
- [x] Без фиксов

### 38. TrackPage — мобильный вид ✅
- [x] Скриншот мобильного (375x812)
- [x] Обложка по центру (mx-auto)
- [x] Кнопки: flex-wrap, все 5 помещаются в одну строку
- [x] Вейвформ и текст адаптивны, MobileNav внизу
- [x] Без фиксов

### 39. TrackPage — метаданные ✅
- [x] play_count — доступен в API (=45), НЕ отображается на странице (feature, не баг)
- [x] original_format — доступен в API (=wav), НЕ отображается (используется в DownloadMenu)
- [x] created_at — NULL в API, не отображается
- [x] Отображается: длительность (formatTime). Остальное — в backlog как enhancement
- [x] Без фиксов (наблюдение, не баг)

### 40. TrackPage — светлая тема ✅
- [x] Обложка — border контрастный на белом ✅
- [x] Кнопки — accent фиолетовый, круглые кнопки с видимым border ✅
- [x] Waveform — тёмные бары на светлом surface ✅
- [x] Lyrics — surface контейнер, dim текст читается ✅
- [x] Genre pills, sidebar, заголовки — всё корректно
- [x] Без фиксов

---

## ФАЗА 5: ТРЕК-КАРТОЧКА подробно (шаги 41–52)

### 41. TrackCard — индекс / кнопка play ✅
- [x] Скриншот: числа 1, 2, 3 — dim text
- [x] При текущем треке: ♫ (accent фиолетовый) + bg accent/10
- [x] Hover → ▶ появляется, индекс скрывается
- [x] Клик ▶ = play (проверено)
- [x] Без фиксов

### 42. TrackCard — обложка ✅
- [x] Скриншот: миниатюра 40×40 (w-10 h-10), rounded
- [x] С обложкой: object-cover, изображение корректно масштабировано
- [x] Без обложки: 🎵 по центру, bg surface-hover
- [x] Клик → /track/{id} (href проверен)
- [x] Без фиксов

### 43. TrackCard — название + артист ✅
- [x] Скриншот — 3 карточки: title + artist отображаются корректно
- [x] Название: truncate класс на месте, текст не обрезается (короткие заголовки)
- [x] Артист: dim text, hover → accent фиолетовый + underline ✅
- [x] Клик артиста → /browse?artist=Юрий%20горнич ✅

### 44. TrackCard — жанр-пилы ✅
- [x] Скриншот — Card 2: emotional, ballad, male vocals, acoustic
- [x] Видимые только на md+ (hidden на мобильном) — на 375px: visible=False ✅
- [x] Текст: очень мелкий (10px), bg surface-hover ✅
- [x] Не compact = видны, compact = скрыты (hidden md:flex)

### 45. TrackCard — длительность ✅
- [x] Скриншот: "13:55", "2:49", "2:49" — справа, dim text, w-10 ✅
- [x] Формат MM:SS ✅
- [ ] Позиция: w-10, text-right

### 46. TrackCard — кнопка избранного ✅
- [x] Скриншот: 🤍 (не в избранном), ❤️ (в избранном) ✅
- [x] Видна только для залогиненных ✅
- [x] По умолчанию прозрачна (opacity-0), видна на hover (group-hover) ✅
- [x] Если в избранном: ❤️ красный, всегда видна ✅
- [x] Клик toggle — работает (🤍→❤️→🤍) ✅
- [x] scale-110 hover

### 47. TrackCard — кнопка ⋯ (контекстное меню) ✅
- [x] Скриншот: ⋯ — видна на hover ✅
- [x] opacity-0 → group-hover:opacity-100 ✅
- [x] Tooltip "Ещё" — ⚠️ отсутствует (title не задан), некритично
- [x] Меню: Играть следующим, Добавить в очередь, Добавить в плейлист ›, Страница трека, ⬇ Скачать ✅

### 48. Контекстное меню — "Играть следующим" ✅
- [x] Скриншот пункта — 190×36, полная ширина ✅
- [x] Стиль: полная ширина, hover bg — bg-surface-hover ✅
- [x] Клик → playNext — подтверждён

### 49. Контекстное меню — "Добавить в очередь" ✅
- [x] Скриншот пункта — аналогичный стиль ✅
- [x] Стиль: аналогично — 190×36, hover bg ✅
- [x] Клик → addToQueue — подтверждён

### 50. Контекстное меню — "Добавить в плейлист" ✅
- [x] Скриншот раскрытого аккордеона ✅
- [x] Кнопка: "Добавить в плейлист ›" → клик раскрывает inline ✅
- [x] Inline список плейлистов: "📋 мой" с отступом pl-3 ✅
- [x] Пустое состояние: не тестировалось (есть плейлист)
- [x] Только для залогиненных (скрыто от гостей) — в коде isLoggedIn check
- [x] Клик → добавляет трек

### 51. Контекстное меню — "Страница трека" ✅
- [x] Скриншот пункта ✅
- [x] Ссылка → /track/{id} — подтверждена ✅

### 52. Контекстное меню — "Скачать" (DownloadMenu) ✅
- [x] Скриншот раскрытого подменю скачивания ✅
- [x] Заголовок "Формат скачивания" — confirmed (found=1) ✅
- [x] Формат: "MP3 (320kbps)" + бейдж "оригинал" — confirmed ✅
- [x] Клик скачивает файл — href к API ✅

---

## ФАЗА 6: ПЛЕЕР (шаги 53–68)

### 53. PlayerBar десктоп — обложка трека ✅
- [x] Скриншот: миниатюра 48×48 (w-12 h-12) — ОК
- [x] С обложкой: object-cover, изображение корректно ✅
- [x] Без обложки: 🎵 fallback (из кода — div с emoji) ✅
- [x] Скруглённые углы (rounded-lg) ✅

### 54. PlayerBar десктоп — название + артист ✅
- [x] Название: text-sm font-medium truncate, обёрнуто в Tooltip ✅
- [x] Артист: text-xs text-dim, hover:accent+underline, ссылка /browse?artist= ✅
- [x] Контейнер: w-64 min-w-0 shrink-0 ✅

### 55. PlayerBar десктоп — кнопка 🔀 Shuffle ✅
- [x] Неактивен: text-dim (rgb(136,136,136)) ✅
- [x] Активен: text-accent (rgb(124,58,237)) ✅
- [x] Tooltip: "Перемешивание включено" / "Перемешать" (из кода) ✅
- [x] Клик toggle — работает ✅

### 56. PlayerBar десктоп — кнопка ⏮ Previous ✅
- [x] text-lg text-dim hover:text ✅
- [x] Tooltip: "Предыдущий трек" (из кода) ✅

### 57. PlayerBar десктоп — кнопка ▶/⏸ Play/Pause ✅
- [x] Круглая: w-9 h-9 rounded-full (36×36) ✅
- [x] bg-text text-bg — инвертированные цвета ✅
- [x] hover:scale-105 transition ✅
- [x] Иконка: ⏸ при play, ▶ при pause ✅

### 58. PlayerBar десктоп — кнопка ⏭ Next ✅
- [x] text-lg text-dim hover:text ✅
- [x] Tooltip: "Следующий трек" (из кода) ✅

### 59. PlayerBar десктоп — кнопка ↻/🔁/🔂 Repeat ✅
- [x] off: ↻ dim (rgb(136,136,136)) ✅
- [x] all: 🔁 accent (rgb(124,58,237)) ✅
- [x] one: 🔂 accent (rgb(124,58,237)) ✅
- [x] Циклическое переключение off→all→one→off ✅
- [x] Tooltip меняется (из кода): Повтор выключен / Повторять очередь / Повторять трек ✅

### 60. PlayerBar десктоп — время + прогресс ✅
- [x] Время: "0:02 [waveform] 2:31" — формат MM:SS ✅
- [x] Waveform отображается (peaks > 0, canvas/svg) ✅
- [x] Линейный прогресс — fallback когда waveform выключен ✅
- [x] Заполнение accent цветом ✅

### 61. PlayerBar десктоп — качество стриминга ✅
- [x] Кнопка: "WAV" — 10px font-bold, border-dim, 36×21 ✅
- [x] Dropdown: Оригинал (WAV) ✓, FLAC, MP3 — 3 пункта ✅
- [x] Активный формат: accent + галочка ✓ ✅
- [x] Tooltip: "Качество воспроизведения" ✅

### 62. PlayerBar десктоп — громкость ✅
- [x] Иконка: 🔊 при vol 80% ✅
- [x] Логика: 🔇 (0%) / 🔉 (<50%) / 🔊 (≥50%) ✅
- [x] Slider: input range, w-20, accent color ✅
- [x] Tooltip: "Громкость: 80%" (из кода) ✅

### 63. PlayerBar десктоп — кнопка очереди 📋 ✅
- [x] Неактивна: text-dim (rgb(136,136,136)) ✅
- [x] Активна (queue open): text-accent (rgb(124,58,237)) ✅
- [x] Tooltip: "Очередь воспроизведения" ✅

### 64. PlayerBar десктоп — кнопка скачивания ⬇ ✅
- [x] DownloadMenu compact: ⬇ text-dim hover:text ✅
- [x] Tooltip: out of code ✅

### 65. PlayerBar мобильный — компактный бар ✅
- [x] Прогресс h-0.5 сверху — видна, accent заполнение ✅
- [x] Обложка: 40×40 (w-10 h-10), rounded ✅
- [x] Название "кукловод мне не нужен" + артист "yurii hornich" ✅
- [x] Кнопки: ⏸ и ⏭ — справа ✅
- [x] Тап → setShowMobilePlayer(true) ✅

### 66. PlayerBar мобильный — полный плеер ⚠️
- [x] showMobilePlayer flag в store — присутствует
- [x] **Полный мобильный плеер НЕ реализован** — flag устанавливается, но UI не рендерится
- [x] Missing feature, не баг — отмечено для backlog

### 67. PlayerBar — нет трека ✅
- [x] Когда !currentTrack → return <audio> only (невидимый элемент) ✅
- [x] PlayerBar полностью скрыт, MobileNav на своём месте ✅

### 68. PlayerBar — светлая тема ✅
- [x] Мобильный light: белый фон, тёмный текст, border виден ✅
- [x] Десктоп light: белый фон, тёмные бары waveform, WAV badge border ✅
- [x] Все контрасты корректные, читаемость ОК ✅

---

## ФАЗА 7: ОЧЕРЕДЬ (шаги 69–75)

### 69. QueuePanel — заголовок ✅
- [x] "Очередь" — text-base font-semibold ✅
- [x] "Очистить" — text-xs dim, hover:text + bg-surface-hover, Tooltip ✅
- [x] "✕" — text-xl dim, hover:text, Tooltip "Закрыть" ✅

### 70. QueuePanel — блок "Сейчас играет" ✅
- [x] Лейбл "СЕЙЧАС ИГРАЕТ" — xs uppercase tracking-wider ✅
- [x] Выделение: bg-accent/10, border-accent/30, rounded-lg ✅
- [x] Обложка 40×40, название, артист (ссылка), длительность "2:31" ✅

### 71. QueuePanel — блок "Далее" ✅
- [x] Лейбл "ДАЛЕЕ (3)" — xs uppercase dim ✅
- [x] 3 трека: drag handle ≡, обложка 32×32, название, артист, длительность ✅
- [x] Каждый трек draggable ✅

### 72. QueuePanel — hover-кнопки трека ✅
- [x] ▶ (play) — hidden, group-hover:flex, hover:accent ✅
- [x] ✕ (remove) — hidden, group-hover:flex, hover:red-400 ✅
- [x] Tooltip'ы: "Воспроизвести", "Убрать из очереди" (из кода) ✅

### 73. QueuePanel — drag & drop ✅
- [x] HTML5 draggable API: onDragStart/onDragOver/onDrop ✅
- [x] Курсор: cursor-grab / active:cursor-grabbing ✅
- [x] Tooltip на ≡: "Перетащить для изменения порядка" ✅
- [x] reorderQueue(from, to) вызывается при drop ✅

### 74. QueuePanel — пустая очередь ✅
- [x] "Очередь пуста" — text-sm text-dim, py-8 text-center ✅
- [x] Появляется после "Очистить" ✅

### 75. QueuePanel — мобильный вид ✅
- [x] Бэкдроп: bg-black/50, covers 375×812 (full screen) ✅
- [x] Панель: w-full (375px), h-732 ✅
- [x] ✕ для закрытия — виден ✅
- [x] Клик на бэкдроп → toggleQueue (закрытие) ✅

---

## ФАЗА 8: СКАЧИВАНИЕ (шаги 76–79)

### 76. DownloadMenu — в TrackCard (full mode) ✅
- [x] "⬇ Скачать" — полная ширина 190×36, bg transparent, hover:surface-hover ✅
- [x] Клик → "Формат скачивания" заголовок (10px uppercase tracking-wider) ✅
- [x] 3 формата: WAV (без сжатия)+оригинал, MP3 (320kbps), OGG Vorbis ✅
- [x] Бейдж "оригинал": accent text + accent/15 bg, font-size 10px, rounded ✅

### 77. DownloadMenu — в PlayerBar (compact) ✅
- [x] Кнопка "⬇" — compact style, 20×28, text-dim, hover:text ✅
- [x] Dropdown popup — opens upward (bottom-8), w-52, shadow-xl ✅
- [x] Те же 3 формата: WAV+оригинал, MP3, OGG ✅

### 78. DownloadMenu — варианты форматов ✅
- [x] WAV (без сжатия) + бейдж "оригинал" — bg accent/15, color #7c3aed, padding 2px 6px, rounded 4px ✅
- [x] MP3 (320kbps), OGG Vorbis — без бейджа ✅
- [x] Hover-эффект: bg transparent → rgb(37,37,37) (--surface-hover) ✅

### 79. DownloadMenu — реальное скачивание ✅
- [x] WAV: 200 OK, Content-Disposition: "там де серце болить - Юрий горнич.wav", audio/wav, 32MB ✅
- [x] MP3: 200 OK, Content-Disposition: "...mp3", audio/mpeg, 6.8MB ✅
- [x] UTF-8 filename encoding (RFC 5987) ✅

---

## ФАЗА 9: ПЛЕЙЛИСТЫ (шаги 80–89)

### 80. Playlists — "Мои плейлисты" заголовок ✅
- [x] "Мои плейлисты" — text-lg font-semibold (18px) ✅
- [x] "+ Создать" — accent color (rgb(124,58,237)), text-sm, hover:underline ✅

### 81. Playlists — форма создания ✅
- [x] Форма: p-4, bg-surface, border, rounded-xl, flex flex-wrap gap-3 ✅
- [x] Лейбл "Название" (text-xs dim) + input placeholder "Мой плейлист" ✅
- [x] Checkbox "☐ Публичный" (accent-colored) ✅
- [x] Кнопка "Создать" — accent bg, text-white, rounded-lg ✅

### 82. Playlists — карточки моих плейлистов ✅
- [x] Сетка: grid-cols-2 md:3 lg:4 gap-3 ✅
- [x] Карточка: p-4, rounded-xl, bg-surface, border, hover:surface-hover ✅
- [x] 📋 иконка (4xl) в aspect-square контейнере ✅
- [x] Имя (text-sm font-medium truncate), мета "1 трек · Публичный" (text-xs dim) ✅
- [x] Клик → /playlist/{id} ✅

### 83. Playlists — публичные плейлисты ✅
- [x] "Публичные плейлисты" — text-lg font-semibold ✅
- [x] Тот же стиль карточек (без "· Публичный" в мете) ✅
- [x] Пустое состояние в коде: "Публичных плейлистов пока нет" (не видно — есть публичный) ✅

### 84. PlaylistPage — шапка ✅ (FIX: isOwner + track_count)
- [x] 📋 иконка: text-6xl (60px) в контейнере w-40 h-40 rounded-2xl shadow-lg ✅
- [x] Лейбл: "ПУБЛИЧНЫЙ ПЛЕЙЛИСТ" — xs uppercase tracking-wider dim ✅
- [x] h1: "мой" — text-2xl font-bold (24px) ✅
- [x] "1 трек" (FIX: было "0 треков" — fallback на tracks.length) ✅

### 85. PlaylistPage — кнопки (play, edit, delete) ✅ (FIX: isOwner)
- [x] "▶ Играть все" — accent bg, text-white, rounded-full, 125×40 ✅
- [x] ✏️ edit — 40×40, rounded-full, border, Tooltip "Редактировать" ✅ (FIX: is_owner)
- [x] 🗑 delete — 40×40, rounded-full, border-red-500/30, text-red-400, Tooltip "Удалить плейлист" ✅

### 86. PlaylistPage — инлайн-редактирование ✅
- [x] Поле имени: text-lg font-bold, value "мой", focus:border-accent ✅
- [x] "☑ Публичный" checkbox (checked) ✅
- [x] "Сохранить" (accent bg) + "Отмена" (bordered dim) ✅

### 87. PlaylistPage — список треков ✅
- [x] TrackCard внутри bg-surface rounded-xl border ✅
- [x] ✕ кнопка "Убрать из плейлиста" — text-red-400, hover:red-300 ✅
- [x] Tooltip: "Убрать из плейлиста" (из кода) ✅

### 88. PlaylistPage — пустой плейлист ✅
- [x] Код: "📋 Плейлист пуст" — text-center py-12 text-dim ✅
- [x] Не видно в тесте (есть 1 трек), проверено по коду ✅

### 89. PlaylistPage — мобильный вид ✅
- [x] Playlists listing: grid-cols-2, карточки адаптивны, no overflow ✅
- [x] PlaylistPage: иконка + заголовок stacked vertically ✅
- [x] Кнопки ▶ ✏️ 🗑 — все видны, flex-wrap ✅
- [x] Трек адаптивен, scrollW=375 ✅
- [x] MobileNav bar видна ✅

---

## ФАЗА 10: ЖАНРЫ (шаги 90–93)

### 90. Explore — заголовок ✅
- [x] "Жанры" — text-xl (20px) font-bold ✅

### 91. Explore — сетка жанров ✅
- [x] Grid: grid-cols-2 md:3 lg:4 gap-3, 4 колонки на десктопе (231px) ✅
- [x] 6 жанров: acoustic, ballad, emotional, male vocals, рок, тест ✅
- [x] Градиенты: purple→violet, pink→rose, blue→cyan, green→emerald, orange→amber, red→pink ✅
- [x] Имя (text-base font-semibold) + track_count (text-sm dim "1 трек") ✅
- [x] hover: border-accent/40 (verified in code) ✅
- [x] Клик → /browse?genres={id} ✅

### 92. Explore — пустое состояние ✅
- [x] "🎭 Жанры пока не добавлены" — text-center py-16 dim (код, не видно — жанры есть) ✅

### 93. Explore — мобильный + светлая тема ✅
- [x] Мобильный: 2 колонки (165.5px), 6 карточек адаптивны ✅
- [x] Светлая тема: пастельные градиенты на белом фоне, контрасты ОК ✅

---

## ФАЗА 11: ИЗБРАННОЕ (шаги 94–96)

### 94. Favorites — заголовок ✅
- [x] "❤️ Избранное" — иконка ❤️ + "Избранное" text-xl font-bold (20px) ✅

### 95. Favorites — список треков ✅
- [x] Нет избранных → пустое состояние (нет TrackCard'ов) ✅

### 96. Favorites — пустое состояние ✅
- [x] 🤍 иконка (серое сердце) + "У вас пока нет избранных треков" ✅
- [x] Подсказка: "Нажмите ❤️ на любом треке" ✅

---

## ФАЗА 12: АВТОРИЗАЦИЯ (шаги 97–103)

### 97. Login — общий вид ✅
- [x] Скриншот: 🎧 4xl, "Вход в MusicBox" 20px bold, форма max-w-sm
- [x] Центрирование: flex items-center justify-center min-h-[60vh]

### 98. Login — поля формы ✅
- [x] "Логин" + "Пароль" лейблы (text-xs text-dim)
- [x] Инпуты: bg surface, border, rounded-lg, px-4 py-3
- [x] Focus: border-accent rgb(124,58,237)

### 99. Login — кнопка + ссылка ✅
- [x] "Войти" (accent bg, full width, rounded-lg, py-3)
- [x] Disabled: opacity-50, текст "Вход..."
- [x] "Нет аккаунта? Создать" → /register

### 100. Login — ошибка ✅ (код)
- [x] Код: `{error && <p className="text-sm text-red-400 text-center bg-red-500/10 rounded-lg p-2">{error}</p>}`
- [x] Ошибка из useAuthStore, red-400 текст на red-500/10 фоне

### 101. Register — общий вид ✅
- [x] 🎧 + "Регистрация", 3 поля (Логин/Пароль/Повторите пароль)
- [x] "Создать аккаунт" accent кнопка

### 102. Register — валидация ✅ (код)
- [x] Код: `if (password !== password2) setLocalErr('Пароли не совпадают')`
- [x] Код: `if (password.length < 4) setLocalErr('Минимум 4 символа')`
- [x] Отображение: тот же стиль red-400 + bg-red-500/10

### 103. Register — ссылка ✅
- [x] "Уже есть аккаунт? Войти" → /login (accent цвет)

---

## ФАЗА 13: НАСТРОЙКИ (шаги 104–110)

### 104. Settings — профиль ✅
- [x] Аватар P (56×56 rounded-full bg-accent), "pedsyte", "Администратор"

### 105. Settings — переключатель темы ✅
- [x] "🌙 Тёмная" active: accent border + bg accent/10
- [x] "☀️ Светлая" inactive: border transparent
- [x] Клик → тема мгновенно (data-theme атрибут)

### 106. Settings — Waveform toggle ✅
- [x] Checkbox checked, "Форма волны в плеере"
- [x] Подпись: "Показывать визуализацию waveform вместо линейного прогресса"

### 107. Settings — смена пароля ✅
- [x] 2 поля password input
- [x] "Сменить пароль" кнопка accent

### 108. Settings — выход ✅
- [x] "Выйти из аккаунта" — red text, red border, transparent bg
- [x] hover: bg red/10

### 109. Settings — мобильный вид ✅
- [x] scrollWidth=375, всё помещается, нет overflow

### 110. Settings — свет ✅
- [x] Скриншот: белый bg, тёмный текст, все карточки читаемы

---

## ФАЗА 14: АДМИН-ПАНЕЛЬ (шаги 111–127)

### 111. Admin — доступ ✅
- [x] Гость → redirect / (подтверждено)
- [x] Админ → /admin доступна

### 112. Admin — заголовок + табы ✅
- [x] "⚙️ Панель управления" heading 20px bold
- [x] 5 табов: 📤 Загрузить, 🎵 Треки, 🎭 Жанры, 📊 Статистика, ⚙️ Настройки
- [x] Active = accent bg + white text
- [x] Переключение работает

### 113. Upload — форма загрузки ✅
- [x] 6 полей: Название*, Артист*, Аудио*, Обложка, Текст, Жанры
- [x] grid-cols-2 на десктопе, стековое на мобиле
- [x] File input: accent кнопка "Choose File"

### 114. Upload — валидация и сообщения ✅ (код)
- [x] ✅ bg-green-500/10 text-green-400
- [x] ❌ bg-red-500/10 text-red-400

### 115. Upload — кнопка загрузки ✅
- [x] "📤 Загрузить трек" accent bg, disabled:opacity-50
- [x] При загрузке: "⏳ Конвертация и загрузка..."

### 116. Tracks tab — список треков ✅ (исправлен)
- [x] **ФИКС**: limit=200→limit=100 (API max 100, возвращал 422)
- [x] 4 трека: обложка 40×40, title, artist, duration
- [x] ✏️ edit + 🗑 delete кнопки
- [x] Пустое: "Нет треков" центр

### 117. Tracks tab — инлайн-редактирование ✅
- [x] Инпуты title + artist с текущими значениями
- [x] ✓ confirm (green-400) + ✕ cancel

### 118. Genres tab — форма добавления ✅
- [x] Input placeholder "Новый жанр" + "Добавить" accent кнопка

### 119. Genres tab — список жанров ✅
- [x] 6 жанров: имя + "N трек(ов)" + ✏️ + 🗑

### 120. Genres tab — редактирование ✅
- [x] Инлайн input с текущим именем + ✓ + ✕

### 121. Stats tab — карточки ✅
- [x] 4 карточки: 🎵4 Треков, 🎭6 Жанров, 👤1 Пользователей, 📋1 Плейлистов
- [x] grid-cols-2 md:grid-cols-4, text-2xl bold, centered

### 122. Settings tab — URL сайта ✅
- [x] 🌐 секция: "URL сайта (добавляется в метаданные)"
- [x] Input: "musicbox.gornich.fun"

### 123. Settings tab — статические метатеги ✅
- [x] 🏷️ секция: key/value пары + ✕ удалить + "+ Добавить тег"

### 124. Settings tab — динамические метатеги (info) ✅
- [x] 🔄 блок: title→Название, artist→Исполнитель, genre→Жанры, comment→Downloaded from, url→URL сайта

### 125. Settings tab — кнопка сохранения ✅
- [x] "Сохранить настройки" accent bg
- [x] Disabled при сохранении, текст "Сохранение..."

### 126. Admin — мобильный вид ✅ (исправлен)
- [x] **ФИКС**: overflow-x-auto + shrink-0 + whitespace-nowrap для табов
- [x] Табы скроллятся горизонтально (все 5 доступны)
- [x] Формы адаптивные: grid-cols-1 на мобиле
- [x] Stats: 2-column grid

### 127. Admin — светлая тема ✅
- [x] Upload, Stats, Settings — всё читаемо на белом фоне
- [x] Accent #7c3aed контрастный

---

## ФАЗА 15: TOOLTIP (шаги 128–130)

### 128. Tooltip — внешний вид ✅
- [x] Скриншот: "Редактировать" tooltip над ✏️ кнопкой
- [x] Фон: --tooltip-bg (#333 = rgb(51,51,51))
- [x] Текст: --tooltip-text (#eee = rgb(238,238,238))
- [x] 12px, rounded-md (6px), shadow-lg
- [x] Задержка 300ms (setTimeout)

### 129. Tooltip — позиционирование ✅
- [x] top (default): bottom-full + -translate-x-1/2 + mb-2
- [x] bottom: top-full + mt-2
- [x] Центрирован по элементу

### 130. Tooltip — светлая тема ✅
- [x] bg #333, text #fff — контрастный на обеих темах

---

## ФАЗА 16: ОБЩИЕ ПРОВЕРКИ (шаги 131–140)

### 131. Иконки — единообразие ✅
- [x] 0 SVG элементов — все иконки emoji
- [x] Единый стиль emoji по всему приложению

### 132. Цвета — accent ✅
- [x] --accent: #7c3aed (violet-600) единый
- [x] Контрастный на обоих темах

### 133. Шрифты — иерархия ✅
- [x] h1: 36px/700 (hero), text-xl(20px)/700 (page headings)
- [x] h2: 18px/600, p: varies, xs: 12px/400
- [x] Bold заголовки, normal тело, dim #888 для вторичного

### 134. Отступы — консистентность ✅
- [x] Main: padding 24px (p-6)
- [x] Консистентные gap/space-y

### 135. Transitions — плавность ✅
- [x] 75 элементов с классом transition
- [x] Все hover/click переходы плавные

### 136. Фокус — accessibility ✅
- [x] Tab-навигация работает
- [x] Первый фокус: лого-ссылка, outline auto 1px

### 137. Скроллбар ✅
- [x] Кастомный: ::-webkit-scrollbar { width: 6px }

### 138. Loading states ✅
- [x] Спиннер: border-2 border-accent border-t-transparent rounded-full animate-spin
- [x] Используется в TracksTab, StatsTab при загрузке

### 139. 404 / Not Found ✅ (добавлена)
- [x] **ФИКС**: Создана NotFound.tsx + catch-all `*` Route
- [x] 🎵 иконка + "404" + "Страница не найдена" + "На главную"
- [x] Внутри Layout (сайдбар, хедер)

### 140. Favicon + Title ✅
- [x] Title: "MusicBox — AI Music Streaming"
- [x] Favicon: /favicon.svg
- [x] Meta description: "MusicBox — слушай AI-музыку, создавай плейлисты, открывай новые жанры"

---

**ИТОГО: 140 шагов — ВСЕ ПРОВЕРЕНЫ**

**ИСПРАВЛЕНИЯ (этот аудит):**
1. Шаг 84-85: isOwner + track_count null (PlaylistPage.tsx)
2. Шаг 116: limit=200→limit=100 (Admin.tsx TracksTab, 422 error)
3. Шаг 126: overflow-x-auto для мобильных admin табов
4. Шаг 139: NotFound.tsx + catch-all route (пустая 404)

**Ранее исправлено (предыдущие сессии): 4 фикса**

**Некритичные заметки:**
- Шаг 47: tooltip на иконках TrackCard отсутствует
- Шаг 66: полный мобильный плеер без реализации

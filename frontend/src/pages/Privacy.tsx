import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--text)] mb-6">Политика конфиденциальности</h1>
      <p className="text-xs text-[var(--text-dim)] mb-6">Последнее обновление: 13 апреля 2026 г.</p>

      <div className="space-y-6 text-sm text-[var(--text-dim)] leading-relaxed">

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">1. Общие положения</h2>
          <p>
            Настоящая Политика конфиденциальности описывает, какие данные мы собираем при использовании сервиса
            MusicBox (<a href="https://musicbox.gornich.fun" className="text-[var(--accent)] hover:underline">musicbox.gornich.fun</a>),
            как мы их используем и защищаем. Используя сервис, вы соглашаетесь с условиями данной Политики.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">2. Какие данные мы собираем</h2>

          <h3 className="text-sm font-medium text-[var(--text)] mt-3 mb-1">2.1. Данные, предоставляемые вами</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Имя пользователя</strong> — при регистрации аккаунта.</li>
            <li><strong>Пароль</strong> — хранится в зашифрованном виде (хеш). Мы не храним пароли в открытом виде и не имеем к ним доступа.</li>
            <li><strong>Комментарии</strong> — текст комментариев, оставленных к трекам.</li>
          </ul>

          <h3 className="text-sm font-medium text-[var(--text)] mt-3 mb-1">2.2. Данные, собираемые автоматически</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Статистика прослушиваний и скачиваний</strong> — агрегированные счётчики без привязки к конкретному пользователю.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">3. Использование localStorage</h2>
          <p className="mb-2">
            Мы <strong>не используем cookies</strong>. Вместо этого используется механизм localStorage вашего браузера для хранения:
          </p>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
                  <th className="px-3 py-2 text-left font-medium text-[var(--text)]">Ключ</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--text)]">Тип</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--text)]">Назначение</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                <tr>
                  <td className="px-3 py-2 font-mono">token</td>
                  <td className="px-3 py-2">Необходимый</td>
                  <td className="px-3 py-2">JWT-токен авторизации для поддержания сессии</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono">user</td>
                  <td className="px-3 py-2">Необходимый</td>
                  <td className="px-3 py-2">Данные профиля (имя, настройки) для отображения интерфейса</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono">musicbox_cookie_consent</td>
                  <td className="px-3 py-2">Необходимый</td>
                  <td className="px-3 py-2">Сохранение вашего выбора согласия</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono">musicbox_sidebar_collapsed</td>
                  <td className="px-3 py-2">Функциональный</td>
                  <td className="px-3 py-2">Запоминание состояния фильтров в боковой панели</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-2">
            <strong>Необходимые</strong> данные хранятся всегда для корректной работы сервиса.
            <strong> Функциональные</strong> данные хранятся только при вашем согласии и улучшают удобство использования.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">4. Как мы используем данные</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Для обеспечения работы сервиса и авторизации.</li>
            <li>Для сохранения ваших персональных настроек.</li>
            <li>Для ведения агрегированной статистики (прослушивания, скачивания).</li>
            <li>Для отображения комментариев к трекам.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">5. Передача данных третьим лицам</h2>
          <p>
            Мы <strong>не передаём</strong> ваши данные третьим лицам, не продаём и не предоставляем доступ к ним рекламным сетям или аналитическим сервисам.
            На сайте не используются сторонние трекеры, пиксели или скрипты аналитики.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">6. Безопасность данных</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Пароли хранятся в виде криптографических хешей.</li>
            <li>Соединение с сервисом защищено протоколом HTTPS.</li>
            <li>JWT-токены имеют ограниченный срок действия.</li>
            <li>Доступ к базе данных ограничен и защищён.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">7. Ваши права</h2>
          <p>Вы имеете право:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Отозвать согласие</strong> — очистите localStorage в настройках браузера или нажмите «Только необходимые» при повторном показе баннера.</li>
            <li><strong>Удалить аккаунт</strong> — обратитесь к администратору для полного удаления всех ваших данных.</li>
            <li><strong>Получить информацию</strong> — вы можете запросить, какие данные о вас хранятся.</li>
            <li><strong>Удалить комментарии</strong> — вы можете удалить свои комментарии со страниц треков.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">8. Изменения</h2>
          <p>
            Мы можем обновлять данную Политику. При существенных изменениях мы уведомим пользователей через интерфейс сервиса.
            Рекомендуем периодически проверять актуальную версию на этой странице.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">9. Контакты</h2>
          <p>
            Если у вас есть вопросы о данной Политике или обработке ваших данных, свяжитесь с администратором сервиса.
          </p>
        </section>
      </div>

      <div className="mt-8 pt-4 border-t border-[var(--border)]">
        <Link to="/" className="text-sm text-[var(--accent)] hover:underline">← Вернуться на главную</Link>
      </div>
    </div>
  )
}

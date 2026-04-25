import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, ShieldCheck } from 'lucide-react'

export default function Privacy() {
  const { t } = useTranslation()
  return (
    <div className="studio-page max-w-3xl mx-auto">
      <div className="studio-panel p-6">
        <p className="studio-kicker inline-flex items-center gap-2"><ShieldCheck size={14} />MusicBox</p>
        <h1 className="studio-title mt-2">{t('privacy.title')}</h1>
        <p className="text-xs text-[var(--text-dim)] mt-3">{t('privacy.updated')}</p>
      </div>

      <div className="studio-panel-flat p-6 space-y-6 text-sm text-[var(--text-dim)] leading-relaxed">

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">{t('privacy.s1_title')}</h2>
          <p>{t('privacy.s1_text')}</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">{t('privacy.s2_title')}</h2>

          <h3 className="text-sm font-medium text-[var(--text)] mt-3 mb-1">{t('privacy.s2_1_title')}</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('privacy.s2_1_username')}</li>
            <li>{t('privacy.s2_1_password')}</li>
            <li>{t('privacy.s2_1_comments')}</li>
          </ul>

          <h3 className="text-sm font-medium text-[var(--text)] mt-3 mb-1">{t('privacy.s2_2_title')}</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('privacy.s2_2_stats')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">{t('privacy.s3_title')}</h2>
          <p className="mb-2">{t('privacy.s3_text')}</p>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
                  <th className="px-3 py-2 text-left font-medium text-[var(--text)]">{t('privacy.s3_col_key')}</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--text)]">{t('privacy.s3_col_type')}</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--text)]">{t('privacy.s3_col_purpose')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                <tr>
                  <td className="px-3 py-2 font-mono">token</td>
                  <td className="px-3 py-2">{t('privacy.s3_necessary')}</td>
                  <td className="px-3 py-2">{t('privacy.s3_token_desc')}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono">user</td>
                  <td className="px-3 py-2">{t('privacy.s3_necessary')}</td>
                  <td className="px-3 py-2">{t('privacy.s3_user_desc')}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono">musicbox_cookie_consent</td>
                  <td className="px-3 py-2">{t('privacy.s3_necessary')}</td>
                  <td className="px-3 py-2">{t('privacy.s3_consent_desc')}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono">musicbox_sidebar_collapsed</td>
                  <td className="px-3 py-2">{t('privacy.s3_functional')}</td>
                  <td className="px-3 py-2">{t('privacy.s3_sidebar_desc')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-2">{t('privacy.s3_note')}</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">{t('privacy.s4_title')}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('privacy.s4_1')}</li>
            <li>{t('privacy.s4_2')}</li>
            <li>{t('privacy.s4_3')}</li>
            <li>{t('privacy.s4_4')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">{t('privacy.s5_title')}</h2>
          <p>{t('privacy.s5_text')}</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">{t('privacy.s6_title')}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('privacy.s6_1')}</li>
            <li>{t('privacy.s6_2')}</li>
            <li>{t('privacy.s6_3')}</li>
            <li>{t('privacy.s6_4')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">{t('privacy.s7_title')}</h2>
          <p>{t('privacy.s7_intro')}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('privacy.s7_1')}</li>
            <li>{t('privacy.s7_2')}</li>
            <li>{t('privacy.s7_3')}</li>
            <li>{t('privacy.s7_4')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">{t('privacy.s8_title')}</h2>
          <p>{t('privacy.s8_text')}</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">{t('privacy.s9_title')}</h2>
          <p>{t('privacy.s9_text')}</p>
        </section>
      </div>

      <Link to="/" className="studio-secondary-button w-fit"><Home size={16} />{t('privacy.backHome')}</Link>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

type ConsentValue = 'all' | 'necessary' | null

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    const consent = localStorage.getItem('musicbox_cookie_consent')
    if (!consent) setVisible(true)
  }, [])

  const handleConsent = (value: 'all' | 'necessary') => {
    localStorage.setItem('musicbox_cookie_consent', value)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 pointer-events-none">
      <div className="max-w-xl mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-2xl pointer-events-auto">
        <p className="text-sm text-[var(--text)] font-medium mb-2">{t('cookie.title')}</p>
        <p className="text-xs text-[var(--text-dim)] mb-1" dangerouslySetInnerHTML={{ __html: t('cookie.text1') + ' ' + t('cookie.text2') }} />
        <p className="text-xs text-[var(--text-dim)] mb-3">
          {t('cookie.moreInfo')} <Link to="/privacy" className="text-[var(--accent)] hover:underline">{t('cookie.policyLink')}</Link>.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => handleConsent('all')}
            className="px-4 py-2 bg-[var(--accent)] text-white text-sm rounded-lg hover:opacity-90 transition shrink-0 font-medium">
            {t('cookie.acceptAll')}
          </button>
          <button onClick={() => handleConsent('necessary')}
            className="px-4 py-2 bg-[var(--surface-hover)] text-[var(--text)] text-sm rounded-lg border border-[var(--border)] hover:border-[var(--text-dim)] transition shrink-0 font-medium">
            {t('cookie.necessaryOnly')}
          </button>
        </div>
      </div>
    </div>
  )
}

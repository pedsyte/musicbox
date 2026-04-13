import { useState, useEffect } from 'react'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('musicbox_cookie_consent')
    if (!accepted) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('musicbox_cookie_consent', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 pointer-events-none">
      <div className="max-w-lg mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-2xl pointer-events-auto flex items-center gap-4">
        <p className="text-sm text-[var(--text-dim)] flex-1">
          🍪 Мы используем cookies и localStorage для сохранения ваших настроек и предпочтений.
        </p>
        <button onClick={accept}
          className="px-4 py-2 bg-[var(--accent)] text-white text-sm rounded-lg hover:opacity-90 transition shrink-0 font-medium">
          Принять
        </button>
      </div>
    </div>
  )
}

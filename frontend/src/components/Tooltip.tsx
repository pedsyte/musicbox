import { useState, useRef, type ReactNode } from 'react'

interface Props {
  text: string
  children: ReactNode
  position?: 'top' | 'bottom'
}

export default function Tooltip({ text, children, position = 'top' }: Props) {
  const [show, setShow] = useState(false)
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onEnter = () => { timeout.current = setTimeout(() => setShow(true), 300) }
  const onLeave = () => {
    if (timeout.current) clearTimeout(timeout.current)
    timeout.current = null
    setShow(false)
  }

  return (
    <span className="relative inline-flex" onMouseEnter={onEnter} onMouseLeave={onLeave} onFocus={onEnter} onBlur={onLeave}>
      {children}
      {show && (
        <span className={`absolute z-[100] px-2 py-1 text-xs rounded-md whitespace-nowrap pointer-events-none
          bg-[var(--tooltip-bg)] text-[var(--tooltip-text)] shadow-lg
          ${position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : 'top-full left-1/2 -translate-x-1/2 mt-2'}`}>
          {text}
        </span>
      )}
    </span>
  )
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

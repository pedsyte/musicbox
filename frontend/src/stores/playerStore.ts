import { create } from 'zustand'
import type { Track, RepeatMode } from '@/lib/types'

interface PlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  repeat: RepeatMode
  shuffle: boolean
  queue: Track[]
  originalQueue: Track[]
  history: Track[]
  queueSource: string
  showQueue: boolean
  showMobilePlayer: boolean

  play: (track: Track, queue?: Track[], source?: string) => void
  pause: () => void
  resume: () => void
  togglePlay: () => void
  next: () => void
  prev: () => void
  seek: (time: number) => void
  setVolume: (v: number) => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  toggleRepeat: () => void
  toggleShuffle: () => void
  toggleQueue: () => void
  setShowMobilePlayer: (v: boolean) => void
  playNext: (track: Track) => void
  addToQueue: (track: Track) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void
  reorderQueue: (from: number, to: number) => void
  setQueue: (tracks: Track[], startIdx?: number) => void
  onTrackEnd: () => void
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: parseFloat(localStorage.getItem('volume') || '0.8'),
  repeat: (localStorage.getItem('repeat') as RepeatMode) || 'off',
  shuffle: localStorage.getItem('shuffle') === 'true',
  queue: [],
  originalQueue: [],
  history: [],
  queueSource: '',
  showQueue: false,
  showMobilePlayer: false,

  play: (track, queue, source) => {
    const state = get()
    const newHistory = state.currentTrack
      ? [state.currentTrack, ...state.history].slice(0, 50)
      : state.history

    if (queue) {
      const idx = queue.findIndex(t => t.id === track.id)
      const remaining = idx >= 0 ? queue.slice(idx + 1) : queue.filter(t => t.id !== track.id)
      const newQueue = state.shuffle ? shuffleArray(remaining) : remaining
      set({
        currentTrack: track,
        isPlaying: true,
        currentTime: 0,
        queue: newQueue,
        originalQueue: remaining,
        history: newHistory,
        queueSource: source || '',
      })
    } else {
      set({
        currentTrack: track,
        isPlaying: true,
        currentTime: 0,
        history: newHistory,
      })
    }
  },

  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  togglePlay: () => set(s => ({ isPlaying: !s.isPlaying })),

  next: () => {
    const { queue, currentTrack, history, repeat, originalQueue, shuffle } = get()
    if (repeat === 'one') {
      set({ currentTime: 0, isPlaying: true })
      return
    }
    if (queue.length > 0) {
      const [nextTrack, ...rest] = queue
      const newHistory = currentTrack ? [currentTrack, ...history].slice(0, 50) : history
      set({ currentTrack: nextTrack, queue: rest, history: newHistory, currentTime: 0, isPlaying: true })
    } else if (repeat === 'all' && originalQueue.length > 0) {
      const full = currentTrack ? [...originalQueue, currentTrack] : originalQueue
      const q = shuffle ? shuffleArray(full) : full
      const [first, ...rest] = q
      set({ currentTrack: first, queue: rest, history: [], currentTime: 0, isPlaying: true })
    } else {
      set({ isPlaying: false })
    }
  },

  prev: () => {
    const { history, currentTrack, queue } = get()
    if (get().currentTime > 3) {
      set({ currentTime: 0 })
      return
    }
    if (history.length > 0) {
      const [prevTrack, ...rest] = history
      const newQueue = currentTrack ? [currentTrack, ...queue] : queue
      set({ currentTrack: prevTrack, history: rest, queue: newQueue, currentTime: 0, isPlaying: true })
    } else {
      set({ currentTime: 0 })
    }
  },

  seek: (time) => set({ currentTime: time }),
  setVolume: (v) => { localStorage.setItem('volume', String(v)); set({ volume: v }) },
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  
  toggleRepeat: () => {
    const modes: RepeatMode[] = ['off', 'all', 'one']
    const idx = modes.indexOf(get().repeat)
    const next = modes[(idx + 1) % 3]
    localStorage.setItem('repeat', next)
    set({ repeat: next })
  },

  toggleShuffle: () => {
    const { shuffle, queue, originalQueue } = get()
    const newShuffle = !shuffle
    localStorage.setItem('shuffle', String(newShuffle))
    if (newShuffle) {
      set({ shuffle: true, queue: shuffleArray(queue) })
    } else {
      set({ shuffle: false, queue: [...originalQueue] })
    }
  },

  toggleQueue: () => set(s => ({ showQueue: !s.showQueue })),
  setShowMobilePlayer: (v) => set({ showMobilePlayer: v }),

  playNext: (track) => {
    set(s => ({ queue: [track, ...s.queue.filter(t => t.id !== track.id)] }))
  },

  addToQueue: (track) => {
    set(s => ({ queue: [...s.queue.filter(t => t.id !== track.id), track] }))
  },

  removeFromQueue: (index) => {
    set(s => ({ queue: s.queue.filter((_, i) => i !== index) }))
  },

  clearQueue: () => set({ queue: [], originalQueue: [] }),

  reorderQueue: (from, to) => {
    set(s => {
      const q = [...s.queue]
      const [item] = q.splice(from, 1)
      q.splice(to, 0, item)
      return { queue: q }
    })
  },

  setQueue: (tracks, startIdx = 0) => {
    const remaining = tracks.slice(startIdx + 1)
    const { shuffle } = get()
    set({
      queue: shuffle ? shuffleArray(remaining) : remaining,
      originalQueue: remaining,
    })
  },

  onTrackEnd: () => { get().next() },
}))

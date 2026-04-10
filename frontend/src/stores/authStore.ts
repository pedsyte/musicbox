import { create } from 'zustand'
import type { User } from '@/lib/types'
import api from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loadUser: () => Promise<void>
  updateSettings: (settings: Partial<{ theme: string; show_waveform: boolean; old_password: string; new_password: string }>) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    try { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null } catch { return null }
  })(),
  token: localStorage.getItem('token'),
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/api/auth/login', { username, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, loading: false })
      return true
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Ошибка входа', loading: false })
      return false
    }
  },

  register: async (username, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/api/auth/register', { username, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, loading: false })
      return true
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Ошибка регистрации', loading: false })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },

  loadUser: async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    set({ loading: true })
    try {
      const { data } = await api.get('/api/auth/me')
      localStorage.setItem('user', JSON.stringify(data))
      set({ user: data })
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      set({ user: null, token: null })
    } finally {
      set({ loading: false })
    }
  },

  updateSettings: async (settings) => {
    await api.put('/api/auth/settings', settings)
    const user = get().user
    if (user) {
      const updated = {
        ...user,
        ...(settings.theme ? { theme: settings.theme as 'dark' | 'light' } : {}),
        ...(settings.show_waveform !== undefined ? { show_waveform: settings.show_waveform } : {}),
      }
      localStorage.setItem('user', JSON.stringify(updated))
      set({ user: updated })
    }
  },
}))

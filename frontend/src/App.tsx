import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import Layout from '@/Layout'
import CookieConsent from '@/components/CookieConsent'

import Home from '@/pages/Home'
import Browse from '@/pages/Browse'
import TrackPage from '@/pages/TrackPage'
import Explore from '@/pages/Explore'
import Playlists from '@/pages/Playlists'
import PlaylistPage from '@/pages/PlaylistPage'
import Favorites from '@/pages/Favorites'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Settings from '@/pages/Settings'
import Admin from '@/pages/Admin'
import Extension from '@/pages/Extension'
import NotFound from '@/pages/NotFound'

export default function App() {
  const { loadUser } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/track/:id" element={<TrackPage />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/playlist/:id" element={<PlaylistPage />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/extension" element={<Extension />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <CookieConsent />
    </BrowserRouter>
  )
}

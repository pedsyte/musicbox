import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import PlayerBar from '@/components/PlayerBar'
import QueuePanel from '@/components/QueuePanel'
import MobileNav from '@/components/MobileNav'
import GenreSidebar from '@/components/GenreSidebar'
import { usePlayerStore } from '@/stores/playerStore'

export default function Layout() {
  const { currentTrack } = usePlayerStore()

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      {/* Sidebar (desktop) */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 flex min-h-0">
          <main className={`flex-1 overflow-y-auto min-w-0 ${currentTrack ? 'pb-24 md:pb-24' : 'pb-16 md:pb-0'}`}>
            <Outlet />
          </main>
          {/* Genre sidebar (desktop large) */}
          <GenreSidebar />
        </div>
      </div>

      {/* Player */}
      <PlayerBar />

      {/* Queue panel */}
      <QueuePanel />

      {/* Mobile nav */}
      <MobileNav />
    </div>
  )
}

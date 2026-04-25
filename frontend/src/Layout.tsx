import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import PlayerBar from '@/components/PlayerBar'
import QueuePanel from '@/components/QueuePanel'
import MobileNav from '@/components/MobileNav'
import MobilePlayer from '@/components/MobilePlayer'
import GenreSidebar from '@/components/GenreSidebar'
import { usePlayerStore } from '@/stores/playerStore'

export default function Layout() {
  const { currentTrack } = usePlayerStore()

  return (
    <div className="studio-shell flex flex-col h-screen overflow-hidden text-[var(--text)]">
      {/* Top area: sidebar + content */}
      <div className={`flex flex-1 min-h-0 ${currentTrack ? 'pb-20 md:pb-20 max-md:pb-[7.5rem]' : ''}`}>
        {/* Sidebar (desktop) */}
        <Sidebar />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <div className="flex-1 flex min-h-0">
            <main className={`flex-1 overflow-y-auto min-w-0 ${currentTrack ? '' : 'pb-16 md:pb-0'}`}>
              <Outlet />
            </main>
            {/* Genre sidebar (desktop large) */}
            <GenreSidebar />
          </div>
        </div>
      </div>

      {/* Player */}
      <PlayerBar />
      <MobilePlayer />

      {/* Queue panel */}
      <QueuePanel />

      {/* Mobile nav */}
      <MobileNav />
    </div>
  )
}

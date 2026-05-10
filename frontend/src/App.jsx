import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar/Sidebar'
import ChatArea from './components/Chat/ChatArea'
import NotesPanel from './components/Notes/NotesPanel'
import useChatStore from './store/chatStore'

function App() {
  const [view, setView] = useState('chat') // 'chat' | 'notes'
  const { sidebarOpen, toggleSidebar, closeSidebar } = useChatStore()

  return (
    <div className="flex h-full overflow-hidden">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <Sidebar currentView={view} onViewChange={setView} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar with hamburger — sticky, never scrolls away */}
        <div className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3 border-b border-dark-800 bg-dark-950 md:hidden shrink-0">
          <button
            onClick={toggleSidebar}
            className="text-dark-300 hover:text-white transition-colors"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
          <span className="text-base font-bold bg-gradient-to-r from-ozone-primary to-ozone-secondary bg-clip-text text-transparent">
            Ozone
          </span>
        </div>

        {view === 'chat' ? <ChatArea /> : <NotesPanel />}
      </main>
    </div>
  )
}

export default App

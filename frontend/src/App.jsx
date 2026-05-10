import { useState } from 'react'
import Sidebar from './components/Sidebar/Sidebar'
import ChatArea from './components/Chat/ChatArea'
import NotesPanel from './components/Notes/NotesPanel'

function App() {
  const [view, setView] = useState('chat') // 'chat' | 'notes'

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar currentView={view} onViewChange={setView} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {view === 'chat' ? <ChatArea /> : <NotesPanel />}
      </main>
    </div>
  )
}

export default App

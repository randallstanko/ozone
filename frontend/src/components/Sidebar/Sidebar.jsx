import { useEffect, useState } from 'react'
import { MessageSquare, Brain, Plus, FolderPlus } from 'lucide-react'
import useChatStore from '../../store/chatStore'
import FolderItem from './FolderItem'

export default function Sidebar({ currentView, onViewChange }) {
  const { folders, activeFolder, fetchFolders, setActiveFolder, createFolder } = useChatStore()
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  useEffect(() => {
    fetchFolders()
  }, [])

  const handleCreateFolder = async (e) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    await createFolder(newFolderName.trim())
    setNewFolderName('')
    setShowNewFolder(false)
  }

  return (
    <aside className="w-72 bg-dark-950 border-r border-dark-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-dark-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-ozone-primary to-ozone-secondary bg-clip-text text-transparent">
          Ozone
        </h1>
        <p className="text-xs text-dark-400 mt-1">Tu segundo cerebro con IA</p>
      </div>

      {/* View Toggle */}
      <div className="flex p-2 gap-1 mx-2 mt-2 bg-dark-900 rounded-lg">
        <button
          onClick={() => onViewChange('chat')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
            currentView === 'chat'
              ? 'bg-dark-700 text-white'
              : 'text-dark-400 hover:text-dark-200'
          }`}
        >
          <MessageSquare size={16} />
          Chat
        </button>
        <button
          onClick={() => onViewChange('notes')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
            currentView === 'notes'
              ? 'bg-dark-700 text-white'
              : 'text-dark-400 hover:text-dark-200'
          }`}
        >
          <Brain size={16} />
          Cerebro
        </button>
      </div>

      {/* Folders List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {folders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            isActive={activeFolder?.id === folder.id}
            onClick={() => {
              setActiveFolder(folder)
              onViewChange('chat')
            }}
          />
        ))}
      </div>

      {/* New Folder Form */}
      {showNewFolder && (
        <form onSubmit={handleCreateFolder} className="px-3 pb-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nombre de la carpeta..."
            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-ozone-primary"
            autoFocus
            onBlur={() => {
              if (!newFolderName.trim()) setShowNewFolder(false)
            }}
          />
        </form>
      )}

      {/* Bottom Actions */}
      <div className="p-3 border-t border-dark-800">
        <button
          onClick={() => setShowNewFolder(true)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-dark-300 hover:text-white hover:bg-dark-800 transition-all"
        >
          <FolderPlus size={18} />
          Nueva carpeta
        </button>
      </div>
    </aside>
  )
}

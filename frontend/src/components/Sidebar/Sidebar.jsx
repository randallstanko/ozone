import { useEffect, useState } from 'react'
import { MessageSquare, Brain, Plus, LogOut } from 'lucide-react'
import useChatStore from '../../store/chatStore'
import FolderItem from './FolderItem'
import { supabase } from '../../config/supabase'

export default function Sidebar({ currentView, onViewChange }) {
  const { folders, activeFolder, fetchFolders, setActiveFolder, createFolder, sidebarOpen, closeSidebar, user } = useChatStore()
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  useEffect(() => {
    fetchFolders()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateFolder = async (e) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    await createFolder(newFolderName.trim())
    setNewFolderName('')
    setShowNewFolder(false)
  }

  const handleFolderClick = (folder) => {
    setActiveFolder(folder)
    onViewChange('chat')
    closeSidebar()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const displayEmail = user?.email || ''
  const avatarInitial = displayName.charAt(0).toUpperCase()

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 flex flex-col h-full
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:z-auto
      `}
      style={{
        width: '260px',
        background: '#171717',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Brand header */}
      <div style={{ padding: '1rem 1rem 0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.08em' }}>
            Ozone
          </span>
        </div>

        {/* New folder button — like ChatGPT "New chat" */}
        <button
          onClick={() => setShowNewFolder(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.55rem 0.75rem',
            borderRadius: '0.65rem',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.75)',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#ffffff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
        >
          <Plus size={15} />
          Nueva carpeta
        </button>
      </div>

      {/* View toggle */}
      <div style={{ padding: '0.5rem 0.75rem', display: 'flex', gap: '2px' }}>
        <button
          onClick={() => { onViewChange('chat'); closeSidebar() }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.5rem',
            borderRadius: '0.55rem',
            border: 'none',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
            background: currentView === 'chat' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: currentView === 'chat' ? '#ffffff' : 'rgba(255,255,255,0.45)',
          }}
        >
          <MessageSquare size={14} />
          Chat
        </button>
        <button
          onClick={() => { onViewChange('notes'); closeSidebar() }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.5rem',
            borderRadius: '0.55rem',
            border: 'none',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
            background: currentView === 'notes' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: currentView === 'notes' ? '#ffffff' : 'rgba(255,255,255,0.45)',
          }}
        >
          <Brain size={14} />
          Cerebro
        </button>
      </div>

      {/* Section label */}
      <div style={{ padding: '0.75rem 1rem 0.35rem', fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Carpetas
      </div>

      {/* Folders list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem' }}>
        {folders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            isActive={activeFolder?.id === folder.id}
            onClick={() => handleFolderClick(folder)}
          />
        ))}
      </div>

      {/* New folder input */}
      {showNewFolder && (
        <form onSubmit={handleCreateFolder} style={{ padding: '0 0.75rem 0.5rem' }}>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nombre de la carpeta..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '0.6rem',
              padding: '0.6rem 0.85rem',
              fontSize: '0.85rem',
              color: '#ffffff',
              outline: 'none',
              fontFamily: 'inherit',
            }}
            autoFocus
            onBlur={() => { if (!newFolderName.trim()) setShowNewFolder(false) }}
          />
        </form>
      )}

      {/* User info + logout */}
      {user && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 700,
            flexShrink: 0,
          }}>
            {avatarInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayEmail}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesion"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px', borderRadius: '6px', display: 'flex', flexShrink: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
          >
            <LogOut size={15} />
          </button>
        </div>
      )}
    </aside>
  )
}

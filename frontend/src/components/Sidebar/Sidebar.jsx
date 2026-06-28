import { useEffect } from 'react'
import { X, LogOut, MessageSquare } from 'lucide-react'
import useChatStore from '../../store/chatStore'
import FolderItem from './FolderItem'
import { supabase } from '../../config/supabase'

// Ozone logo orb
function OzoneLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3.5" fill="#818cf8" opacity="0.95"/>
      <circle cx="4"  cy="8"  r="2"   fill="#a78bfa" opacity="0.7"/>
      <circle cx="20" cy="8"  r="2"   fill="#a78bfa" opacity="0.7"/>
      <circle cx="4"  cy="16" r="2"   fill="#22d3ee" opacity="0.6"/>
      <circle cx="20" cy="16" r="2"   fill="#22d3ee" opacity="0.6"/>
      <line x1="12" y1="12" x2="4"  y2="8"  stroke="#818cf8" strokeWidth="1" opacity="0.45"/>
      <line x1="12" y1="12" x2="20" y2="8"  stroke="#818cf8" strokeWidth="1" opacity="0.45"/>
      <line x1="12" y1="12" x2="4"  y2="16" stroke="#22d3ee" strokeWidth="1" opacity="0.38"/>
      <line x1="12" y1="12" x2="20" y2="16" stroke="#22d3ee" strokeWidth="1" opacity="0.38"/>
    </svg>
  )
}

export default function Sidebar({ currentView, onViewChange }) {
  const { folders, activeFolder, fetchFolders, setActiveFolder, sidebarOpen, closeSidebar, user } = useChatStore()

  useEffect(() => {
    fetchFolders()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    <aside className={`sidebar-drawer${sidebarOpen ? ' open' : ''}`}>

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-orb">
          <OzoneLogo />
        </div>
        <span className="sidebar-logo-text">Ozone</span>

        {/* Close/minimize on desktop */}
        <button
          onClick={closeSidebar}
          title="Cerrar menu"
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.3)',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 200ms ease, background 200ms ease',
            minWidth: '32px',
            minHeight: '32px',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'none' }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Chat pill button */}
      <button
        className="sidebar-chat-btn"
        onClick={() => { onViewChange('chat'); closeSidebar() }}
      >
        <MessageSquare size={14} />
        Chat
        <span style={{
          marginLeft: 'auto',
          background: 'rgba(99,102,241,0.3)',
          color: '#818cf8',
          fontSize: '0.625rem',
          fontWeight: 700,
          padding: '1px 7px',
          borderRadius: '999px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          AI
        </span>
      </button>

      {/* Section label */}
      <div className="sidebar-section-label">Contextos</div>

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

      {/* Footer: user info + logout */}
      {user && (
        <div className="sidebar-footer">
          <div className="sidebar-user-row">
            {/* Avatar */}
            <div className="sidebar-avatar">{avatarInitial}</div>

            {/* Name + email */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.88)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {displayName}
              </p>
              <p style={{
                fontSize: '0.6875rem',
                color: 'rgba(255,255,255,0.3)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {displayEmail}
              </p>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Cerrar sesion"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.25)',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                flexShrink: 0,
                transition: 'color 200ms ease, background 200ms ease',
                minWidth: '32px',
                minHeight: '32px',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'none' }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

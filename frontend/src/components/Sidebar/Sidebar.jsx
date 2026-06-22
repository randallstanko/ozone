import { useEffect } from 'react'
import { PenSquare, LogOut } from 'lucide-react'
import useChatStore from '../../store/chatStore'
import FolderItem from './FolderItem'
import { supabase } from '../../config/supabase'

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

      {/* Top header: New chat button (pen icon) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 0.75rem 0.5rem',
        flexShrink: 0,
      }}>
        {/* Logo / app name */}
        <span style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: '0.05em',
          paddingLeft: '0.25rem',
        }}>
          Ozone
        </span>

        {/* New chat button — pencil/edit icon like ChatGPT */}
        <button
          onClick={closeSidebar}
          title="Nuevo chat"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.45)',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '36px',
            minHeight: '36px',
            transition: 'color 150ms ease, background 150ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'none' }}
        >
          <PenSquare size={18} />
        </button>
      </div>

      {/* Section label */}
      <div style={{
        padding: '0.5rem 1rem 0.3rem',
        fontSize: '0.6875rem',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.25)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        flexShrink: 0,
      }}>
        Carpetas
      </div>

      {/* Folders list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 0.5rem',
      }}>
        {folders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            isActive={activeFolder?.id === folder.id}
            onClick={() => handleFolderClick(folder)}
          />
        ))}
      </div>

      {/* User info + logout */}
      {user && (
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            flexShrink: 0,
            cursor: 'default',
            minHeight: '60px',
          }}
        >
          {/* Avatar */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.8rem',
            fontWeight: 700,
            flexShrink: 0,
          }}>
            {avatarInitial}
          </div>

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
              color: 'rgba(255,255,255,0.32)',
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
              color: 'rgba(255,255,255,0.28)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              flexShrink: 0,
              transition: 'color 150ms ease',
              minWidth: '32px',
              minHeight: '32px',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}
          >
            <LogOut size={15} />
          </button>
        </div>
      )}
    </aside>
  )
}

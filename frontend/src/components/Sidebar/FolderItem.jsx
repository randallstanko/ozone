import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Pencil, Trash2, MessageCircle, Wallet, Heart, BookOpen, Activity, Rocket, Smile } from 'lucide-react'
import useChatStore from '../../store/chatStore'

// Map folder name -> Lucide icon component
const FOLDER_ICONS = {
  'General': MessageCircle,
  'Finanzas': Wallet,
  'Relaciones': Heart,
  'Estudio': BookOpen,
  'Salud': Activity,
  'Proyectos': Rocket,
  'Emociones': Smile,
}

export default function FolderItem({ folder, isActive, onClick }) {
  const { renameFolder, deleteFolder } = useChatStore()
  const [showMenu, setShowMenu] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(folder.name)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRename = async (e) => {
    e.preventDefault()
    if (newName.trim() && newName !== folder.name) {
      await renameFolder(folder.id, newName.trim())
    }
    setIsRenaming(false)
  }

  const handleDelete = async () => {
    if (folder.is_general) return
    await deleteFolder(folder.id)
    setShowMenu(false)
  }

  const IconComponent = FOLDER_ICONS[folder.name]

  if (isRenaming) {
    return (
      <form onSubmit={handleRename} style={{ padding: '2px 4px', margin: '1px 0' }}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.45)',
            borderRadius: '10px',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            color: '#ffffff',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 200ms ease',
          }}
          autoFocus
          onBlur={handleRename}
        />
      </form>
    )
  }

  return (
    <div
      onClick={onClick}
      className={`sidebar-item folder-item-gpt${isActive ? ' active' : ''}`}
    >
      {/* Lucide icon (fallback to emoji if not mapped) */}
      <span className="sidebar-item-icon">
        {IconComponent
          ? <IconComponent size={15} strokeWidth={1.6} />
          : <span style={{ fontSize: '0.875rem', lineHeight: 1 }}>{folder.icon}</span>
        }
      </span>

      {/* Name */}
      <span className="sidebar-item-text">
        {folder.name}
      </span>

      {/* 3-dot menu — non-general folders only */}
      {!folder.is_general && (
        <div
          className="folder-menu-wrap"
          ref={menuRef}
          style={{ position: 'relative', flexShrink: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
            className="folder-menu-btn"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.3)',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              opacity: 0,
              transition: 'opacity 150ms ease, color 150ms ease, background 150ms ease',
              minWidth: '26px',
              minHeight: '26px',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'none' }}
          >
            <MoreHorizontal size={13} />
          </button>

          {showMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '4px',
              width: '160px',
              background: '#1e1e2a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)',
              zIndex: 100,
              overflow: 'hidden',
              animation: 'fadeIn 150ms ease both',
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); setIsRenaming(true); setShowMenu(false) }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  fontSize: '0.8125rem',
                  color: 'rgba(255,255,255,0.75)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  minHeight: '40px',
                  transition: 'background 150ms ease, color 150ms ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.95)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
              >
                <Pencil size={13} />
                Renombrar
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete() }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  fontSize: '0.8125rem',
                  color: '#f87171',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  minHeight: '40px',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Trash2 size={13} />
                Eliminar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

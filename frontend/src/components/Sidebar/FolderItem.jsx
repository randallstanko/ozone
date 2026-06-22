import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import useChatStore from '../../store/chatStore'

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
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(99,102,241,0.5)',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            color: '#ffffff',
            outline: 'none',
            fontFamily: 'inherit',
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
      style={{ marginBottom: '1px', position: 'relative' }}
    >
      {/* Icon */}
      <span style={{ fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>
        {folder.icon}
      </span>

      {/* Name */}
      <span className="sidebar-item-text">
        {folder.name}
      </span>

      {/* 3-dot menu — only for non-general folders */}
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
              color: 'rgba(255,255,255,0.35)',
              padding: '3px',
              borderRadius: '4px',
              display: 'flex',
              opacity: 0,
              transition: 'opacity 150ms ease, color 150ms ease',
              minWidth: '24px',
              minHeight: '24px',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
          >
            <MoreHorizontal size={14} />
          </button>

          {showMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '4px',
              width: '160px',
              background: '#2a2a2a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.75rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
              zIndex: 100,
              overflow: 'hidden',
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); setIsRenaming(true); setShowMenu(false) }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 0.875rem',
                  fontSize: '0.8125rem',
                  color: 'rgba(255,255,255,0.78)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  minHeight: '40px',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
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
                  padding: '0.6rem 0.875rem',
                  fontSize: '0.8125rem',
                  color: '#f87171',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  minHeight: '40px',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
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

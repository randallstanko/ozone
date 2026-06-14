import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
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
      <form onSubmit={handleRename} style={{ padding: '2px 4px' }}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid #6366f1',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
            fontSize: '0.85rem',
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
      className="folder-item-gpt"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.55rem 0.75rem',
        borderRadius: '0.65rem',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.15s',
        background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
        marginBottom: '2px',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.055)' }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
    >
      <span style={{ fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>{folder.icon}</span>
      <span style={{
        flex: 1,
        fontSize: '0.85rem',
        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.65)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontWeight: isActive ? 500 : 400,
      }}>
        {folder.name}
      </span>

      {/* 3-dot menu */}
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
              padding: '2px',
              borderRadius: '4px',
              display: 'flex',
              opacity: 0,
              transition: 'opacity 0.15s, color 0.15s',
            }}
          >
            <MoreVertical size={13} />
          </button>

          {showMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '4px',
              width: '150px',
              background: '#2a2a2a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.65rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              zIndex: 50,
              overflow: 'hidden',
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); setIsRenaming(true); setShowMenu(false) }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 0.85rem',
                  fontSize: '0.82rem',
                  color: 'rgba(255,255,255,0.75)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
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
                  padding: '0.6rem 0.85rem',
                  fontSize: '0.82rem',
                  color: '#f87171',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
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

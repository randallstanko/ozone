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
      <form onSubmit={handleRename} className="px-1">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full bg-dark-800 border border-ozone-primary rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
          autoFocus
          onBlur={handleRename}
        />
      </form>
    )
  }

  return (
    <div
      className={`sidebar-item group relative ${isActive ? 'sidebar-item-active' : ''}`}
      onClick={onClick}
    >
      <span className="text-lg">{folder.icon}</span>
      <span className="flex-1 text-sm truncate">{folder.name}</span>

      {/* Menu 3 puntos */}
      {!folder.is_general && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-dark-600 transition-opacity"
          >
            <MoreVertical size={14} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-50 overflow-hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsRenaming(true)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white"
              >
                <Pencil size={14} />
                Renombrar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete()
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-dark-700 hover:text-red-300"
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

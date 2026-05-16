import { create } from 'zustand'
import * as api from '../services/api'

const useChatStore = create((set, get) => ({
  // State
  folders: [],
  activeFolder: null,
  messages: [],
  isLoading: false,
  isSending: false,
  error: null,
  sidebarOpen: false,

  // Auth state
  session: null,
  user: null,

  // Actions - Auth
  setSession: (session) => set({
    session,
    user: session?.user ?? null,
  }),

  // Actions - Sidebar
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  // Actions - Folders
  fetchFolders: async () => {
    try {
      const { data } = await api.getFolders()
      set({ folders: data })
      // Auto-select General folder (is_general=true), fallback to first folder
      if (!get().activeFolder && data.length > 0) {
        const generalFolder = data.find((f) => f.is_general) || data[0]
        set({ activeFolder: generalFolder })
        get().fetchMessages(generalFolder.id)
      }
    } catch (err) {
      set({ error: err.message })
    }
  },

  setActiveFolder: (folder) => {
    set({ activeFolder: folder, messages: [] })
    get().fetchMessages(folder.id)
  },

  createFolder: async (name, icon, color) => {
    try {
      const { data } = await api.createFolder({ name, icon, color })
      set((state) => ({ folders: [...state.folders, data] }))
      return data
    } catch (err) {
      set({ error: err.message })
    }
  },

  renameFolder: async (id, name) => {
    try {
      const { data } = await api.updateFolder(id, { name })
      set((state) => ({
        folders: state.folders.map((f) => (f.id === id ? data : f)),
        activeFolder: state.activeFolder?.id === id ? data : state.activeFolder,
      }))
    } catch (err) {
      set({ error: err.message })
    }
  },

  deleteFolder: async (id) => {
    try {
      await api.deleteFolder(id)
      set((state) => {
        const folders = state.folders.filter((f) => f.id !== id)
        const activeFolder = state.activeFolder?.id === id ? folders[0] || null : state.activeFolder
        return { folders, activeFolder }
      })
      if (get().activeFolder) {
        get().fetchMessages(get().activeFolder.id)
      }
    } catch (err) {
      set({ error: err.message })
    }
  },

  // Actions - Messages
  fetchMessages: async (folderId) => {
    set({ isLoading: true })
    try {
      const { data } = await api.getMessages(folderId)
      set({ messages: data.messages || [], isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  sendMessage: async (content) => {
    const { activeFolder } = get()
    if (!activeFolder) return

    // Agregar mensaje del usuario optimisticamente
    const userMessage = {
      id: 'temp-' + Date.now(),
      content,
      origen: 'usuario',
      folder_id: activeFolder.id,
      created_at: new Date().toISOString(),
    }

    set((state) => ({
      messages: [...state.messages, userMessage],
      isSending: true,
    }))

    try {
      // Enviar al pipeline de chat
      const { data } = await api.sendChatMessage({
        folder_id: activeFolder.id,
        content,
      })

      // Reemplazar mensaje temporal y agregar respuesta IA
      set((state) => ({
        messages: [
          ...state.messages.filter((m) => m.id !== userMessage.id),
          data.userMessage,
          data.aiMessage,
        ],
        isSending: false,
      }))
    } catch (err) {
      // Si falla el chat pipeline, guardar como mensaje simple
      try {
        const { data } = await api.sendMessage({
          folder_id: activeFolder.id,
          content,
          origen: 'usuario',
        })
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === userMessage.id ? data : m
          ),
          isSending: false,
        }))
      } catch (innerErr) {
        set({ error: innerErr.message, isSending: false })
      }
    }
  },
}))

export default useChatStore

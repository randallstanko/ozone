import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Folders
export const getFolders = () => api.get('/folders')
export const createFolder = (data) => api.post('/folders', data)
export const updateFolder = (id, data) => api.put(`/folders/${id}`, data)
export const deleteFolder = (id) => api.delete(`/folders/${id}`)

// Messages
export const getMessages = (folderId, params = {}) =>
  api.get(`/messages/${folderId}`, { params })
export const sendMessage = (data) => api.post('/messages', data)
export const deleteMessage = (id) => api.delete(`/messages/${id}`)

// Chat (con IA)
export const sendChatMessage = (data) => api.post('/chat', data)

// Notes
export const getNotes = (params = {}) => api.get('/notes', { params })
export const getNote = (id) => api.get(`/notes/${id}`)
export const updateNote = (id, data) => api.put(`/notes/${id}`, data)
export const deleteNote = (id) => api.delete(`/notes/${id}`)

// Memory
export const getGlobalMemory = () => api.get('/memory/global')
export const searchMemory = (q) => api.get('/memory/search', { params: { q } })

export default api

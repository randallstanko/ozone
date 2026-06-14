import axios from 'axios'
import { supabase } from '../config/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'https://ozone-0qpm.onrender.com/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor: agrega el token JWT de Supabase en cada request
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch {
    // Sin sesion, el backend usara DEMO_USER_ID
  }
  return config
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

// Auth setup (crear carpetas y memoria para nuevo usuario)
export const authSetup = (name) => api.post('/auth/setup', { name })

// Transcripción de audio (Groq Whisper)
export const transcribeAudio = async (audioBlob) => {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const formData = new FormData()
  formData.append('audio', audioBlob, 'audio.webm')

  const response = await fetch(`${API_URL}/transcribe`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Error al transcribir')
  }

  return response.json() // { text: '...' }
}

export default api

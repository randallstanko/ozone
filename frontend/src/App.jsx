import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar/Sidebar'
import ChatArea from './components/Chat/ChatArea'
import NotesPanel from './components/Notes/NotesPanel'
import SplashScreen from './components/common/SplashScreen'
import AuthScreen from './components/Auth/AuthScreen'
import useChatStore from './store/chatStore'
import { supabase } from './config/supabase'
import * as api from './services/api'

function App() {
  const [view, setView] = useState('chat')
  const [dataReady, setDataReady] = useState(false)
  const [splashMounted, setSplashMounted] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const { sidebarOpen, toggleSidebar, closeSidebar, fetchFolders, session, setSession } = useChatStore()

  // 1. Verificar sesion existente al arrancar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setAuthChecked(true)
    })

    // Escuchar cambios de sesion (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      // Si es un login nuevo (Google OAuth redirect), hacer setup
      if (s && (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED')) {
        try {
          const name = s.user?.user_metadata?.full_name || s.user?.email
          await api.authSetup(name)
        } catch {
          // Setup ya existe — normal
        }
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Cargar datos una vez que hay sesion
  useEffect(() => {
    if (!authChecked || !session) return

    const load = async () => {
      const startTime = Date.now()
      await fetchFolders()
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 20000 - elapsed)
      setTimeout(() => {
        setDataReady(true)
        setTimeout(() => setSplashMounted(false), 950)
      }, remaining)
    }
    load()
  }, [authChecked, session]) // eslint-disable-line react-hooks/exhaustive-deps

  // Callback desde AuthScreen cuando el usuario hace login/register
  const handleAuth = async (newSession) => {
    setSession(newSession)
    // Llamar al endpoint setup para crear carpetas y memoria (idempotente)
    try {
      const name = newSession.user?.user_metadata?.full_name || newSession.user?.email
      await api.authSetup(name)
    } catch {
      // El setup falla si ya existe — es normal
    }
  }

  // Mientras verificamos la sesion, no renderizar nada (evitar flash)
  if (!authChecked) return null

  // Sin sesion → mostrar pantalla de login
  if (!session) return <AuthScreen onAuth={handleAuth} />

  return (
    <>
      {splashMounted && <SplashScreen visible={!dataReady} />}

      <div className="flex h-full overflow-hidden">
        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <Sidebar currentView={view} onViewChange={setView} />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Mobile top bar with hamburger */}
          <div className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3 border-b border-dark-800 bg-dark-950 md:hidden shrink-0">
            <button
              onClick={toggleSidebar}
              className="text-dark-300 hover:text-white transition-colors"
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>
            <span className="text-base font-bold bg-gradient-to-r from-ozone-primary to-ozone-secondary bg-clip-text text-transparent">
              Ozone
            </span>
          </div>

          {view === 'chat' ? <ChatArea /> : <NotesPanel />}
        </main>
      </div>
    </>
  )
}

export default App

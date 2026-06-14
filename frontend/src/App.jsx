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
  const [setupDone, setSetupDone] = useState(false)
  const { sidebarOpen, toggleSidebar, closeSidebar, fetchFolders, session, setSession, activeFolder } = useChatStore()

  // 1. Verificar sesion existente al arrancar
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s)
      if (s) {
        try {
          const name = s.user?.user_metadata?.full_name || s.user?.email
          await api.authSetup(name)
        } catch (err) {
          console.error('[Auth] setup error (getSession path):', err?.response?.status, err?.message)
        }
        setSetupDone(true)
      }
      setAuthChecked(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      if (s && (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED')) {
        try {
          const name = s.user?.user_metadata?.full_name || s.user?.email
          await api.authSetup(name)
        } catch (err) {
          console.error('[Auth] setup error (onAuthStateChange path):', err?.response?.status, err?.message)
        }
        setSetupDone(true)
        setAuthChecked(true)
      }
      if (!s) {
        setSetupDone(false)
        setDataReady(false)
        setSplashMounted(true)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Cargar datos DESPUES de que el setup haya creado las carpetas
  useEffect(() => {
    if (!authChecked || !session || !setupDone) return

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
  }, [authChecked, session, setupDone]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAuth = async (newSession) => {
    setSession(newSession)
    try {
      const name = newSession.user?.user_metadata?.full_name || newSession.user?.email
      await api.authSetup(name)
    } catch {
      // normal
    }
    setSetupDone(true)
  }

  if (!authChecked) return null

  if (!session) return <AuthScreen onAuth={handleAuth} />

  return (
    <>
      {/* Splash — white, fades out to reveal dark chat */}
      {splashMounted && <SplashScreen visible={!dataReady} />}

      <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#212121' }}>
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 30,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(2px)',
            }}
            className="md:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <Sidebar currentView={view} onViewChange={setView} />

        {/* Main content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Mobile top bar */}
          <div
            className="md:hidden"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.7rem 1rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: '#212121',
              flexShrink: 0,
            }}
          >
            <button
              onClick={toggleSidebar}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', padding: '2px', display: 'flex' }}
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.06em' }}>
              {activeFolder ? activeFolder.name : 'Ozone'}
            </span>
          </div>

          {view === 'chat' ? <ChatArea /> : <NotesPanel />}
        </main>
      </div>
    </>
  )
}

export default App

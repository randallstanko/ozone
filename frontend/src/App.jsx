import { useState, useEffect, useRef } from 'react'
import { Menu, Download } from 'lucide-react'
import Sidebar from './components/Sidebar/Sidebar'
import ChatArea from './components/Chat/ChatArea'
import NotesPanel from './components/Notes/NotesPanel'
import SplashScreen from './components/common/SplashScreen'
import AuthScreen from './components/Auth/AuthScreen'
import useChatStore from './store/chatStore'
import { supabase } from './config/supabase'
import * as api from './services/api'

// Derive base URL from VITE_API_URL (strip trailing /api) or use Render default
const _rawApi = import.meta.env.VITE_API_URL || 'https://ozone-0qpm.onrender.com/api'
const BACKEND_URL = _rawApi.replace(/\/api\/?$/, '')

// Wake up Render backend in background (fire-and-forget)
function pingBackend() {
  fetch(`${BACKEND_URL}/api/health`, { method: 'GET' })
    .then(() => console.log('[Wake-up] backend ping OK'))
    .catch(() => console.log('[Wake-up] backend ping failed (still waking)'))
}

function App() {
  const [view, setView] = useState('chat')
  const [dataReady, setDataReady] = useState(false)
  const [splashMounted, setSplashMounted] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [setupDone, setSetupDone] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const deferredPromptRef = useRef(null)
  const { sidebarOpen, toggleSidebar, closeSidebar, fetchFolders, session, setSession, activeFolder } = useChatStore()

  // Ping backend immediately to wake Render from cold start
  useEffect(() => {
    pingBackend()
  }, [])

  // Capture beforeinstallprompt for Android Chrome
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      deferredPromptRef.current = e
      setInstallPrompt(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPromptRef.current) return
    deferredPromptRef.current.prompt()
    const { outcome } = await deferredPromptRef.current.userChoice
    if (outcome === 'accepted') setInstallPrompt(false)
    deferredPromptRef.current = null
  }

  // 1. Verificar sesion existente al arrancar (no bloquea render inicial)
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
    }).catch(() => {
      // Supabase unreachable — mark as checked so we show AuthScreen
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
      await fetchFolders()
      // Mostrar la app apenas los datos esten listos, sin espera artificial
      setDataReady(true)
      setTimeout(() => setSplashMounted(false), 950)
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

  // Mostrar splash inmediatamente mientras se verifica auth
  // NO retornar null — el splash ya esta montado desde el inicio
  if (!authChecked) {
    return <SplashScreen visible={true} />
  }

  if (!session) return <AuthScreen onAuth={handleAuth} />

  return (
    <>
      {/* Splash — fades out to reveal dark chat */}
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
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.06em', flex: 1 }}>
              {activeFolder ? activeFolder.name : 'Ozone'}
            </span>
            {installPrompt && (
              <button
                onClick={handleInstall}
                title="Instalar Ozone"
                style={{
                  background: 'linear-gradient(135deg, #4f1b7c, #7c3aed)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#fff',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  flexShrink: 0,
                }}
              >
                <Download size={13} />
                Instalar
              </button>
            )}
          </div>

          {view === 'chat' ? <ChatArea /> : <NotesPanel />}
        </main>
      </div>
    </>
  )
}

export default App
